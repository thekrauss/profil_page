async function login(form) {
  const username = form.username.value;
  const password = form.password.value;
  const jwtUrl = "https://zone01normandie.org/api/auth/signin";
  const encodedAuth = btoa(`${username}:${password}`);

  try {
    const response = await fetch(jwtUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${encodedAuth}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Login failed");

    return response.json();
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
}

async function fetchGraphQL(jwt, query) {
  const dataRequestUrl =
    "https://zone01normandie.org/api/graphql-engine/v1/graphql";

  try {
    const response = await fetch(dataRequestUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) throw new Error("GraphQL request failed");

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("GraphQL error:", error);
    return null;
  }
}

async function getData(form, requestedData) {
  const jwt = await login(form);
  if (!jwt) {
    document.getElementById("error").innerText =
      "Unable to log in. Check your credentials.";
    return null;
  }
  return fetchGraphQL(jwt, requestedData);
}

function createPieChart(radius, values, labels) {
  const total = values.reduce((sum, value) => sum + value, 0);
  const pieChart = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );
  pieChart.setAttribute("width", 2 * radius);
  pieChart.setAttribute("height", 2 * radius + 15 * values.length);

  let currentAngle = 0;
  values.forEach((value, index) => {
    const proportion = value / total;
    const angle = proportion * 2 * Math.PI;
    const color = `rgb(${(index * 255) / values.length}, ${
      (index * 255) / values.length
    }, ${(index * 255) / values.length})`;

    pieChart.appendChild(createSegmentPath(radius, currentAngle, angle, color));

    const keySquare = createSvgElement("rect", {
      width: "10",
      height: "10",
      style: `fill:${color}`,
      y: 2 * radius + 15 * index,
    });

    const keyLabel = createSvgElement("text", {
      y: 2 * radius + 10 + 15 * index,
      x: 15,
      innerHTML: `project: ${labels[index]}, xp: ${values[index]}`,
    });

    const key = createSvgElement("g", { color });
    key.appendChild(keySquare);
    key.appendChild(keyLabel);
    pieChart.appendChild(key);

    currentAngle += angle;
  });

  return pieChart;
}

function createSegmentPath(r, startAngle, angle, color) {
  const moveToCenter = `M ${r}, ${r} `;
  const moveToEdge = `L ${Math.cos(startAngle) * r + r}, ${
    Math.sin(startAngle) * r + r
  } `;
  const moveAlongArc = `A ${r}, ${r} 0 ${angle < Math.PI ? "0" : "1"} 1 ${
    Math.cos(startAngle + angle) * r + r
  }, ${Math.sin(startAngle + angle) * r + r} `;
  const path = createSvgElement("path", {
    d: `${moveToCenter}${moveToEdge}${moveAlongArc}Z`,
    fill: color,
    stroke: "green",
  });
  return path;
}

function createSvgElement(tag, attributes) {
  const elem = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === "innerHTML") {
      elem.innerHTML = value;
    } else {
      elem.setAttribute(key, value);
    }
  });
  return elem;
}

function xpQueryPerMajorProject() {
  return {
    query: `{
      xp_per_major_project: transaction(where: {type: {_eq: "xp"}, object: {type: {_eq: "project"}}}) {
        amount
        object {
          name
        }
      }
    }`,
  };
}

function auditRatioQuery() {
  return {
    query: `{
      user {
        auditRatio
      }
    }`,
  };
}

async function basicInfo(form) {
  const query = {
    query: `{
      user {
        login
        campus
        attrs
        transactions(where: {type: {_eq: "xp"}}) {
          amount
          type
          path
        }
      }
      total_xp: transaction_aggregate (
        where: {
          type : {_eq: "xp"}
        }
      ) {
        aggregate {
          sum {
            amount
          }
        }
      }
    }`,
  };

  const data = await getData(form, query);

  console.log("Basic Info Data:", data);

  if (!data || !data.user || !data.total_xp) {
    console.error("Error: Missing data in response.");
    return null;
  }

  const user = data.user[0];
  const totalXP = data.total_xp.aggregate.sum.amount;

  console.log("Data xp :", user.transactions);
  let recup = user.transactions;

  let TotalXp = [];
  let allAmount = 0;

  for (let i = 0; i < recup.length; i++) {
    if (
      recup[i].type === "xp" &&
      recup[i].path &&
      !recup[i].path.includes("piscine-go/") &&
      !recup[i].path.includes("div-01/piscine-js/")
    ) {
      TotalXp.push(recup[i].type);
      if ("amount" in recup[i]) {
        TotalXp.push(recup[i].amount);
        allAmount += recup[i].amount;
      }
    }
  }

  console.log("Filtered Total XP:", allAmount);

  return {
    username: user.login,
    campus: user.campus,
    firstName: user.attrs.firstName,
    lastName: user.attrs.lastName,
    totalXP: allAmount,
  };
}

function displayBasicInfo(basicInfo) {
  if (!basicInfo) return;

  document.getElementById(
    "name"
  ).innerText = `Hi ${basicInfo.firstName} ${basicInfo.lastName} !`;
  document.getElementById(
    "username"
  ).innerText = `Username: ${basicInfo.username}`;
  document.getElementById("campus").innerText = `Campus: ${basicInfo.campus}`;
  document.getElementById("xp").innerText = `Total XP: ${
    basicInfo.totalXP || 0
  }`;
}
function createCircularProgress(radius, auditRatio) {
  const maxRatio = 1.5; // Full circle at 1.5
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference * (1 - Math.min(auditRatio, maxRatio) / maxRatio);
  const roundedRatio = Math.round(auditRatio * 10) / 10; // Arrondir à un dixième

  const svg = createSvgElement("svg", {
    width: radius * 2 + 20, // Adding margin
    height: radius * 2 + 60, // Adding extra space for label
    viewBox: `0 0 ${radius * 2 + 20} ${radius * 2 + 60}`,
    style: "display: block; margin: auto;", // Center the SVG in its container
  });

  const circleBackground = createSvgElement("circle", {
    cx: radius + 10, // Center with margin
    cy: radius + 10, // Center with margin
    r: radius,
    stroke: "#ddd",
    "stroke-width": "15",
    fill: "none",
  });

  const circleProgress = createSvgElement("circle", {
    cx: radius + 10,
    cy: radius + 10,
    r: radius,
    stroke: "green",
    "stroke-width": "15",
    fill: "none",
    "stroke-dasharray": circumference,
    "stroke-dashoffset": offset,
    transform: `rotate(-90 ${radius + 10} ${radius + 10})`, // Rotate to start from top
  });

  const valueText = createSvgElement("text", {
    x: radius + 10,
    y: radius + 20, // Slightly below center for better alignment
    "font-size": "30", // Increased font size for the number
    "font-family": "Arial, sans-serif",
    "text-anchor": "middle",
    "dominant-baseline": "middle",
    fill: "black",
    innerHTML: roundedRatio.toFixed(1), // Display rounded value
  });

  const labelText = createSvgElement("text", {
    x: radius + 10,
    y: radius + 50, // Positioned below the number
    "font-size": "14", // Smaller font size for label
    "font-family": "Arial, sans-serif",
    "text-anchor": "middle",
    "dominant-baseline": "middle",
    fill: "black",
    innerHTML: "Audit Ratio", // Label text
  });

  svg.appendChild(circleBackground);
  svg.appendChild(circleProgress);
  svg.appendChild(valueText); // Add the text to the center
  svg.appendChild(labelText); // Add the label below

  return svg;
}

async function showAuditRatioProgress(form) {
  const data = await getData(form, auditRatioQuery());
  if (!data || !data.user || data.user.length === 0) return;

  const auditRatio = data.user[0].auditRatio;
  console.log("Audit Ratio:", auditRatio);

  // Clear previous content in case of re-renders
  document.getElementById("progressContainer").innerHTML = "";

  // Create a larger progress circle with value display
  const progressCircle = createCircularProgress(100, auditRatio); // Increased radius for larger circle
  document.getElementById("progressContainer").appendChild(progressCircle);
}

async function xpPerProjectPieChart(form) {
  const data = await getData(form, xpQueryPerMajorProject());
  if (!data) return;

  const values = data.xp_per_major_project.map((project) => project.amount);
  const labels = data.xp_per_major_project.map(
    (project) => project.object.name
  );

  const ctx = document.getElementById("pieChart").getContext("2d");
  new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor: values.map(
            (_, index) => `hsl(${(index / values.length) * 360}, 70%, 60%)`
          ),
        },
      ],
    },
    options: {
      responsive: true, // Assure que le graphique est responsive
      maintainAspectRatio: false, // Désactive le ratio fixe pour meilleure flexibilité
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "XP par Projet",
        },
      },
    },
  });
}


async function doStuff(form) {
  document.getElementById("error").innerText = "";
  const basicData = await basicInfo(form);
  if (!basicData) {
    document.getElementById("error").innerText =
      "Unable to log in, please check your credentials.";
    return;
  }

  // Masquer le formulaire de connexion et afficher les informations de profil
  document.getElementById("login").style.display = "none";
  document.getElementById("basicInfo").style.display = "block";
  document.getElementById("svgs").style.display = "flex"; // Affiche les conteneurs de graphiques

  displayBasicInfo(basicData);

  // Temporisation pour s'assurer que le canvas est visible avant de créer les graphiques
  setTimeout(async () => {
    await xpPerProjectPieChart(form);
    await showAuditRatioProgress(form);
  }, 100); // Temporisation de 100ms pour s'assurer que le canvas est visible
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  await doStuff(e.target);
});

// Logout logic
function logout() {
  // Masquer les informations et afficher à nouveau le formulaire de connexion
  document.getElementById("basicInfo").style.display = "none";
  document.getElementById("svgs").style.display = "none";
  document.getElementById("login").style.display = "block";

  // Réinitialiser le formulaire de connexion
  document.getElementById("loginForm").reset();

  // Effacer les messages d'erreur ou autres données affichées
  document.getElementById("error").innerText = "";
  document.getElementById("name").innerText = "";
  document.getElementById("username").innerText = "";
  document.getElementById("campus").innerText = "";
  document.getElementById("xp").innerText = "";
}

// Ajouter l'événement au bouton logout
document.getElementById("logoutButton").addEventListener("click", logout);

