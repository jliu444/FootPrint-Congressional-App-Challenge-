document.addEventListener("DOMContentLoaded", () => {
    const defaultCoordinates = [40.7128, -74.0060]; // Default to New York City
    let map;
    let selectedLatLng;

    const mapBounds = [
        [-85, -180], // South-West corner of the map
        [85, 180]    // North-East corner of the map
    ];

    const crimeCounts = {
        "Sex Crime": 0,
        "Theft Crime": 0,
        "Traffic Offense": 0,
        "Drug Crime": 0,
        "Violent Crime": 0,
        "Homicide": 0,
        "Other": 0
    };

    const modal = document.getElementById("crimeModal");
    const closeModalBtn = document.getElementsByClassName("close")[0];
    const crimeForm = document.getElementById("crimeForm");
    const form = document.getElementsByClassName('modal-content')[0];
    
    closeModalBtn.onclick = function() {
        modal.style.display = "none";
    };

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };

    function initMap(position) {
        const userLocation = position ? [position.coords.latitude, position.coords.longitude] : defaultCoordinates;

        map = L.map('map', {
            center: userLocation,
            zoom: 12,
            maxBounds: mapBounds,      // Sets the map bounds
            maxBoundsViscosity: 1.0,   // Prevents panning outside bounds
            minZoom: 3,                // Minimum zoom level (world view)
            maxZoom: 18                // Maximum zoom level
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);


        fetch('/api/markers')
            .then(response => response.json())
            .then(data => {
                data.forEach(marker => {
                    L.marker([marker.location.lat, marker.location.lng])
                        .addTo(map)
                        .bindPopup(`
                            <strong>Crime Type:</strong> ${marker.crimeType}<br>
                            <strong>Description:</strong> ${marker.description}<br>
                            <strong>Date:</strong> ${marker.date}
                        `)
                    
                    // Update the crime counts
                    if (crimeCounts.hasOwnProperty(marker.crimeType)) {
                        crimeCounts[marker.crimeType]++;
                    } else {
                        crimeCounts.Other++;
                    } 
                });
                updateCrimeTable();
            });

        map.on('click', function(event) {
            selectedLatLng = event.latlng; 
            
            document.getElementById('lat').value = selectedLatLng.lat;
            document.getElementById('lng').value = selectedLatLng.lng;

            modal.style.display = "block";
            form.style.top = window.event.clientY + "px";
            form.style.left = window.event.clientX + "px";
        });
    }
    
    function updateCrimeTable() {
        const tableBody = document.querySelector("#crimeTable tbody");
        tableBody.innerHTML = "";

        Object.keys(crimeCounts).forEach(crimeType => {
            const row = document.createElement("tr");

            const typeCell = document.createElement("td");
            typeCell.textContent = crimeType;
            row.appendChild(typeCell);

            const countCell = document.createElement("td");
            countCell.textContent = crimeCounts[crimeType];
            row.appendChild(countCell);

            tableBody.appendChild(row);
        });
    }

    crimeForm.onsubmit = function(event) {
        event.preventDefault();

        const crimeData = {
            crimeType: document.getElementById('crimeType').value,
            description: document.getElementById('description').value,
            date: document.getElementById('date').value,
            location: {
                lat: document.getElementById('lat').value,
                lng: document.getElementById('lng').value
            }
        };

        L.marker([crimeData.location.lat, crimeData.location.lng])
            .addTo(map)
            .bindPopup(`
                <strong>Crime Type:</strong> ${crimeData.crimeType}<br>
                <strong>Description:</strong> ${crimeData.description}<br>
                <strong>Date:</strong> ${crimeData.date}
            `)
            .openPopup();

        if (crimeCounts.hasOwnProperty(crimeData.crimeType)) {
            crimeCounts[crimeData.crimeType]++;
        } else {
            crimeCounts.Other++;
        }

        updateCrimeTable();

        fetch('/api/markers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(crimeData)
        }).then(response => response.json())
          .then(data => {
              console.log('Crime saved:', data);
              modal.style.display = "none";
          })
          .catch(error => console.error('Error saving crime:', error));
    };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                initMap(position); 
            },
            () => {
                initMap(); 
            }
        );
    } else {
        initMap();
    }
});
