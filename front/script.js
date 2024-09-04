document.addEventListener("DOMContentLoaded", function() {
    if (token){
        fetchUserData();
    }
});

async function fetchUserData() {
    try {
        const token = getTokenFromCookie();
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

        if (response.ok){
            const result = await response.json();
            const user = result.data.user

            document.getElementById('user-id').innerText = `User ID: ${user.id}`;
            document.getElementById('user-login').innerText = `Login: ${user.login}`;

            loadCharts(user.transactions, user.progress, user.results);
        } else{
            console.error('Failed to fetch user data');
        }
    } catch (error){
        console.error('Error fetching user data:', error);
    }
    
}


function getTokenFromCookie() {
    const cookies = document.cookie.split(";").map(cookie => cookie.trim());
    for (const cookie of cookies) {
        if (cookie.startsWith("token=")) {
            return cookie.substring("token=".length);
        }
    }
    return null;
}