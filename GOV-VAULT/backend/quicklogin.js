const axios = require('axios');
axios.post('http://localhost:3000/auth/login', { email: 'admin@govvault.in', password: 'Admin@123' })
    .then(res => console.log(res.data))
    .catch(err => console.log(err.response ? err.response.data : err.message));
