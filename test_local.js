const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function testLocal() {
    try {
        console.log('Testing local backend...');
        const formData = new FormData();
        // Assuming there's a logo.png in the project
        const imgPath = path.join(__dirname, 'client', 'public', 'logo.png');
        if (!fs.existsSync(imgPath)) {
            console.error('Test image not found at ' + imgPath);
            return;
        }
        formData.append('image', fs.createReadStream(imgPath));

        const response = await axios.post('http://localhost:5000/api/detect', formData, {
            headers: formData.getHeaders()
        });

        console.log('Response from local backend:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error during test:', error.response ? error.response.status : error.message);
        if (error.response && error.response.data) {
            console.error('Error detail:', error.response.data);
        }
    }
}

testLocal();
