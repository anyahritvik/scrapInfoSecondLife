document.getElementById("fetchBtn").onclick = async function () {
    const uuidOrName = document.getElementById("uuidInput").value.trim();
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "<div class='loading'>Loading...</div>";

    if (!uuidOrName) {
        resultDiv.innerHTML = "<span class='error'>Please enter a UUID or username.</span>";
        return;
    }

    try {
        const resp = await fetch(`/api/profile/${encodeURIComponent(uuidOrName)}`);
        const data = await resp.json();
        
        if (!data.success) {
            resultDiv.innerHTML = `<span class="error">${data.error}</span>`;
            return;
        }

        const p = data.profile;

        // Format the age details
        const ageDetails = p.ageDetails ? `
            <div class="age-details">
                <div class="detail"><span>Years:</span> ${p.ageDetails.years}</div>
                <div class="detail"><span>Months:</span> ${p.ageDetails.months}</div>
                <div class="detail"><span>Birth Date:</span> ${p.ageDetails.birthDate}</div>
                <div class="detail"><span>Current Date:</span> ${p.ageDetails.currentDate}</div>
            </div>
        ` : '';

        resultDiv.innerHTML = `
            <div class="profile-card">
                <div class="profile-header">
                    <img class="profile-img" src="${p.imgSrc}" alt="Avatar Image">
                    <h2 class="profile-name">${p.displayName || "(unknown)"}</h2>
                </div>
                
                <div class="profile-body">
                    ${p.description ? `
                        <div class="info-section">
                            <h3>Description</h3>
                            <p>${p.description}</p>
                        </div>
                    ` : ''}
                    
                    <div class="info-section">
                        <h3>Resident Details</h3>
                        <div class="info"><strong>UUID:</strong> ${p.uuid}</div>
                        <div class="info"><strong>Born:</strong> ${p.birthInfo}</div>
                        <div class="info"><strong>Age:</strong> ${p.ageInfo}</div>
                        ${ageDetails}
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        resultDiv.innerHTML = `<span class="error">Failed to load profile: ${err.message}</span>`;
    }
};