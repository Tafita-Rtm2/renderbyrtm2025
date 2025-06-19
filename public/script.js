document.addEventListener('DOMContentLoaded', () => {
    const weatherDisplay = document.getElementById('weather-display');
    const adminLoginIcon = document.getElementById('admin-login-icon');

    // Function to fetch weather data from our backend
    async function fetchWeather(location) {
        if (!weatherDisplay) {
            console.error('Weather display element not found');
            return;
        }
        weatherDisplay.textContent = 'Fetching weather...';
        try {
            const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            displayWeather(data);
        } catch (error) {
            console.error('Error fetching weather:', error);
            weatherDisplay.textContent = 'Could not load weather data.';
        }
    }

    // Function to display weather data
    function displayWeather(data) {
        if (!weatherDisplay) {
            console.error('Weather display element not found for displaying data');
            return;
        }
        if (data && data.current) {
            // Example: "Mostly clear, 9°C"
            // We will use an icon later. For now, text representation.
            weatherDisplay.innerHTML = `
                <p><strong>${data.location.name}</strong></p>
                <p>${data.current.skytext}, ${data.current.temperature}°${data.location.degreetype}</p>
                <p>Feels like: ${data.current.feelslike}°${data.location.degreetype}</p>
            `;
        } else if (data && data.error) {
            weatherDisplay.textContent = `Error: ${data.error}`;
        }
        else {
            weatherDisplay.textContent = 'Weather data unavailable.';
        }
    }

    // Admin login icon functionality
    if (adminLoginIcon) {
        adminLoginIcon.addEventListener('click', () => {
            const code = prompt('Enter admin code:');
            if (code === '121206') {
                alert('Admin access granted (simulation)');
            } else if (code !== null) { // Handle if user presses cancel
                alert('Incorrect code.');
            }
        });
    } else {
        console.error('Admin login icon not found');
    }

    // Initial call to fetch weather for Antananarivo
    fetchWeather('Antananarivo');

});
