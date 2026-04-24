const axios = require('axios');
axios.post('http://localhost:3000/auth/register', { email: 'admin2@govvault.in', password: 'Admin@123', role: 'ADMIN' })
    .then(async (res) => {
        console.log("Registered:", res.data);
        const login = await axios.post('http://localhost:3000/auth/login', { email: 'admin2@govvault.in', password: 'Admin@123' })
        console.log("Login Success!", login.data.token.substring(0, 20));
    })
    .catch(err => console.log(err.response ? err.response.data : err.message));
