document.addEventListener("DOMContentLoaded", function() {
    const token = getTokenFromCookie();

    if (token) {
        showProfile(token);
    } else {
        showLogin();
    }

    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const usernameOrEmail = document.getElementById('username_or_email').value;
        const password = document.getElementById('password').value;

        console.log("login", usernameOrEmail, password)
    
        try {
            const response = await fetch('/loginForm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    identifier: usernameOrEmail,
                    password: password
                })
            });
    
            const data = await response.json();
            if (response.ok) {
                document.cookie = `token=${data.token}; path=/; Secure; SameSite=Strict`;
                showProfile(data.token);
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            document.getElementById('error-message').textContent = `Error: ${error.message}`;
        } finally {
            document.getElementById('loading').classList.add('hidden');
        }
    });
    
    // Gestion de la déconnexion
    document.getElementById('logoutButton').addEventListener('click', function() {
        document.cookie = 'token=; Max-Age=0'; 
        showLogin(); 
    });
});

function showLogin() {
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('loginSection').classList.add('visible');
    document.getElementById('profileSection').classList.remove('visible');
    document.getElementById('profileSection').classList.add('hidden');
}

async function showProfile(token) {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('loginSection').classList.remove('visible');
    document.getElementById('profileSection').classList.remove('hidden');
    document.getElementById('profileSection').classList.add('visible');

    // Récupérer les données utilisateur via l'API GraphQL
    try {
        const response = await fetch('/profil', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                query: `
                {
                  user {
                    id
                    login
                    transactions {
                      amount
                    }
                    progress {
                      grade
                    }
                    results {
                      grade
                    }
                  }
                }
              `
            })
        });

        if (response.ok) {
            const result = await response.json();
            const user = result.data.user;

            // Afficher les données utilisateur dans la section du profil
            document.getElementById('user-id').innerText = `User ID: ${user.id}`;
            document.getElementById('user-login').innerText = `Login: ${user.login}`;

            loadCharts(user.transactions, user.progress, user.results);
        } else {
            console.error('Failed to fetch user data:', await response.text());
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

// Fonction pour extraire le JWT du cookie
function getTokenFromCookie() {
    return document.cookie.split('; ').find(row => row.startsWith('token='))
                          ?.split('=')[1];
}

function loadCharts(transactions, progress, results) {
    const chartsDiv = document.getElementById('charts');
    chartsDiv.innerHTML = ''; // Nettoyer les anciens graphiques

    // Dimensions des SVG
    const width = 400;
    const height = 200;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    // Créer un graphique pour les transactions (XP amount)
    const svgTransactions = d3.select("#charts")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "chart");

    const xScaleTransactions = d3.scaleBand()
        .domain(transactions.map((d, i) => i)) // Indexes as domain
        .range([margin.left, width - margin.right])
        .padding(0.2);

    const yScaleTransactions = d3.scaleLinear()
        .domain([0, d3.max(transactions, d => d.amount)])
        .range([height - margin.bottom, margin.top]);

    // Créer les barres pour les transactions
    svgTransactions.selectAll("rect")
        .data(transactions)
        .enter()
        .append("rect")
        .attr("x", (d, i) => xScaleTransactions(i))
        .attr("y", d => yScaleTransactions(d.amount))
        .attr("width", xScaleTransactions.bandwidth())
        .attr("height", d => height - margin.bottom - yScaleTransactions(d.amount))
        .attr("fill", "steelblue")
        .on("mouseover", function(event, d) {
            d3.select(this).attr("fill", "orange");

            svgTransactions.append("text")
                .attr("id", "tooltip")
                .attr("x", event.pageX + 5)
                .attr("y", event.pageY - 5)
                .attr("font-size", "12px")
                .attr("font-weight", "bold")
                .attr("fill", "black")
                .text(`XP: ${d.amount}`);
        })
        .on("mouseout", function() {
            d3.select(this).attr("fill", "steelblue");
            svgTransactions.select("#tooltip").remove();
        });

    // Ajouter les axes pour le graphique des transactions
    svgTransactions.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScaleTransactions).tickFormat((d, i) => `TX ${i + 1}`));

    svgTransactions.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScaleTransactions));

    // Ajouter un titre pour le graphique des transactions
    svgTransactions.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("XP Earned per Transaction");

    // Créer un graphique pour les progressions (grades)
    const svgProgress = d3.select("#charts")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "chart");

    const xScaleProgress = d3.scaleBand()
        .domain(progress.map((d, i) => i)) // Indexes as domain
        .range([margin.left, width - margin.right])
        .padding(0.2);

    const yScaleProgress = d3.scaleLinear()
        .domain([0, d3.max(progress, d => d.grade)])
        .range([height - margin.bottom, margin.top]);

    // Créer les barres pour les progressions (grades)
    svgProgress.selectAll("rect")
        .data(progress)
        .enter()
        .append("rect")
        .attr("x", (d, i) => xScaleProgress(i))
        .attr("y", d => yScaleProgress(d.grade))
        .attr("width", xScaleProgress.bandwidth())
        .attr("height", d => height - margin.bottom - yScaleProgress(d.grade))
        .attr("fill", "green")
        .on("mouseover", function(event, d) {
            d3.select(this).attr("fill", "orange");

            svgProgress.append("text")
                .attr("id", "tooltip")
                .attr("x", event.pageX + 5)
                .attr("y", event.pageY - 5)
                .attr("font-size", "12px")
                .attr("font-weight", "bold")
                .attr("fill", "black")
                .text(`Grade: ${d.grade}`);
        })
        .on("mouseout", function() {
            d3.select(this).attr("fill", "green");
            svgProgress.select("#tooltip").remove();
        });

    // Ajouter les axes pour le graphique des progressions
    svgProgress.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScaleProgress).tickFormat((d, i) => `Task ${i + 1}`));

    svgProgress.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScaleProgress));

    // Ajouter un titre pour le graphique des progressions
    svgProgress.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Grade Progress per Task");
}
