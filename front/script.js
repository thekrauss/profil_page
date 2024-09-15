
document.addEventListener("DOMContentLoaded", function() {
    const token = getTokenFromCookie();

    if (token) {
        showProfile();
    } else {
        showLogin();
    }

    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const usernameOrEmail = document.getElementById('username_or_email').value;
        const password = document.getElementById('password').value;

        console.log("login", usernameOrEmail, password);

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
                showProfile();
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            document.getElementById('error-message').textContent = `Error: ${error.message}`;
        } finally {
            document.getElementById('loading').classList.add('hidden');
        }
    });

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

// Fonction pour extraire le JWT du cookie
function getTokenFromCookie() {
    const tokenCookie = document.cookie.split('; ').find(row => row.startsWith('token='));
    if (tokenCookie) {
        return tokenCookie.split('=')[1];
    }
    return null;
}

// Fonction utilitaire pour envoyer des requêtes GraphQL
async function fetchGraphQL(queryObj) {
    const response = await fetch('/profil', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(queryObj)
    });

    if (response.ok) {
        const result = await response.json();
        return result.data;
    } else {
        console.error('Failed to fetch data:', await response.text());
        throw new Error('GraphQL query failed');
    }
}

// Fonction pour obtenir l'XP par projet majeur
async function getXpPerMajorProject() {
    const queryObj = {
        query: `{
          xp_per_major_project: transaction(
            where: {
              type: {_eq: "xp"},
              object: {type: {_eq: "project"}}
            },
            order_by: {createdAt: desc},
            limit: 10
          ) {
            amount
            object {
              name
            }
            createdAt
          }
        }`,
    };
    const data = await fetchGraphQL(queryObj);
    return data.xp_per_major_project;
}


// Fonction pour obtenir le ratio d'audit
async function getAuditRatio() {
    const queryObj = {
        query: `{
          user {
            auditRatio
          }
        }`,
    };
    const data = await fetchGraphQL(queryObj);
    return data.user[0].auditRatio;
}

// Fonction pour obtenir les informations de base
async function getBasicInfo() {
    const queryObj = {
        query: `{
          user {
            login
            campus
            attrs
            transactions(
              where: {type: {_eq: "xp"}},
              order_by: {createdAt: desc},
              limit: 10
            ) {
              amount
              type
              path
              createdAt
            }
            results(
              order_by: {createdAt: desc},
              limit: 10
            ) {
              grade
              object {
                name
              }
            }
          }
          total_xp: transaction_aggregate(
            where: {type: {_eq: "xp"}}
          ) {
            aggregate {
              sum {
                amount
              }
            }
          }
        }`,
    };
    const data = await fetchGraphQL(queryObj);
    return data;
}



async function showProfile() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('loginSection').classList.remove('visible');
    document.getElementById('profileSection').classList.remove('hidden');
    document.getElementById('profileSection').classList.add('visible');

    try {
        // Récupérer les informations de base
        const basicData = await getBasicInfo();
        const user = basicData.user[0]; 
        const totalXp = basicData.total_xp.aggregate.sum.amount;

        // Afficher les informations 
        document.getElementById('username').innerText = user.login;
        document.getElementById('xp').innerText = `XP : ${totalXp}`;
        document.getElementById('campus').innerText = `Campus : ${user.campus || 'N/A'}`;

        // Récupérer l'XP par projet majeur
        const xpPerProject = await getXpPerMajorProject();

        // Récupérer le ratio d'audit
        const auditRatio = await getAuditRatio();

        // Afficher le ratio d'audit
        document.getElementById('audit-ratio').innerText = `Ratio d'audit : ${auditRatio}`;

        // Vérifier les données results
        console.log('Transactions:', user.transactions);
        console.log('XP per Project:', xpPerProject);
        console.log('Results:', user.results);

        // Charger les graphiques ou afficher les données
        loadCharts(user.transactions, xpPerProject, user.results);
        
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}


function loadCharts(transactions, xpPerProject, results) {
    const chartsDiv = document.getElementById('charts');
    chartsDiv.innerHTML = ''; // Nettoyer les anciens graphiques

    // Dimensions communes ajustées pour la nouvelle disposition
    const width = 500; 
    const height = 300;
    const margin = { top: 40, right: 40, bottom: 50, left: 60 };

    // --- Graphique pour les transactions (montant XP) ---
    {
        const svgTransactions = d3.select("#charts")
            .append("div")
            .attr("class", "chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xScaleTransactions = d3.scaleBand()
            .domain(transactions.map((d, i) => i))
            .range([0, width])
            .padding(0.2);

        const yScaleTransactions = d3.scaleLinear()
            .domain([0, d3.max(transactions, d => d.amount)])
            .range([height, 0]);

        //  les barres pour les transactions
        svgTransactions.selectAll("rect")
            .data(transactions)
            .enter()
            .append("rect")
            .attr("x", (d, i) => xScaleTransactions(i))
            .attr("y", d => yScaleTransactions(d.amount))
            .attr("width", xScaleTransactions.bandwidth())
            .attr("height", d => height - yScaleTransactions(d.amount))
            .attr("fill", "steelblue")
            .on("mouseover", function(event, d) {
                d3.select(this).attr("fill", "orange");

                const [x, y] = d3.pointer(event);
                svgTransactions.append("text")
                    .attr("id", "tooltip")
                    .attr("x", x)
                    .attr("y", y - 10)
                    .attr("font-size", "12px")
                    .attr("text-anchor", "middle")
                    .attr("font-weight", "bold")
                    .attr("fill", "black")
                    .text(`XP: ${d.amount}`);
            })
            .on("mouseout", function() {
                d3.select(this).attr("fill", "steelblue");
                svgTransactions.select("#tooltip").remove();
            });

        //  les axes pour le graphique des transactions
        svgTransactions.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScaleTransactions).tickFormat((d, i) => `TX ${i + 1}`));

        svgTransactions.append("g")
            .call(d3.axisLeft(yScaleTransactions));

        // titre pour le graphique des transactions
        svgTransactions.append("text")
            .attr("x", width / 2)
            .attr("y", -margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("XP des 10 derniéres Transactions");
    }

    //  Graphique circulaire pour l'XP par projet majeur 
    {
        const svgXpPerProjectPie = d3.select("#charts")
            .append("div")
            .attr("class", "chart")
            .append("svg")
            .attr("width", width)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${width / 2}, ${(height + margin.top + margin.bottom) / 2})`);

        const radius = Math.min(width, height) / 2;

        const pie = d3.pie()
            .value(d => d.amount);

        const dataReady = pie(xpPerProject);

        const color = d3.scaleOrdinal()
            .domain(xpPerProject.map(d => d.object.name))
            .range(d3.schemeCategory10);

        const arcGenerator = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);

        svgXpPerProjectPie
            .selectAll('path')
            .data(dataReady)
            .enter()
            .append('path')
            .attr('d', arcGenerator)
            .attr('fill', d => color(d.data.object.name))
            .attr("stroke", "white")
            .style("stroke-width", "2px")
            .on("mouseover", function(event, d) {
                d3.select(this).transition().duration(200).attr('transform', 'scale(1.05)');
                svgXpPerProjectPie.append("text")
                    .attr("id", "tooltip")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "12px")
                    .attr("font-weight", "bold")
                    .attr("fill", "black")
                    .text(`${d.data.object.name}: ${d.data.amount} XP`);
            })
            .on("mouseout", function() {
                d3.select(this).transition().duration(200).attr('transform', 'scale(1)');
                svgXpPerProjectPie.select("#tooltip").remove();
            });

        //  titre pour le diagramme circulaire
        svgXpPerProjectPie.append("text")
            .attr("x", 0)
            .attr("y", - (height + margin.top + margin.bottom) / 2 + 20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("XP des 10 derniers Projet");
    }

    // --- Graphique pour les résultats (grades) ---
    {
        const svgResults = d3.select("#charts")
            .append("div")
            .attr("class", "chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Préparer les données
        const xDomainResults = results.map((d, i) => d.object?.name || `Résultat ${i + 1}`);

        const xScaleResults = d3.scaleBand()
            .domain(xDomainResults)
            .range([0, width])
            .padding(0.2);

        const yScaleResults = d3.scaleLinear()
            .domain([0, d3.max(results, d => d.grade)])
            .range([height, 0]);

        //les barres pour les résultats
        svgResults.selectAll("rect")
            .data(results)
            .enter()
            .append("rect")
            .attr("x", (d, i) => xScaleResults(xDomainResults[i]))
            .attr("y", d => yScaleResults(d.grade))
            .attr("width", xScaleResults.bandwidth())
            .attr("height", d => height - yScaleResults(d.grade))
            .attr("fill", "green")
            .on("mouseover", function(event, d) {
                d3.select(this).attr("fill", "orange");

                const [x, y] = d3.pointer(event);
                svgResults.append("text")
                    .attr("id", "tooltip")
                    .attr("x", x)
                    .attr("y", y - 10)
                    .attr("font-size", "12px")
                    .attr("text-anchor", "middle")
                    .attr("font-weight", "bold")
                    .attr("fill", "black")
                    .text(`Grade: ${d.grade}`);
            })
            .on("mouseout", function() {
                d3.select(this).attr("fill", "green");
                svgResults.select("#tooltip").remove();
            });

        // axes pour le graphique des résultats
        svgResults.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScaleResults));

        svgResults.append("g")
            .call(d3.axisLeft(yScaleResults));

        // titre pour le graphique des résultats
        svgResults.append("text")
            .attr("x", width / 2)
            .attr("y", -margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Grades des 10 derniers Résultats");
    }
}
