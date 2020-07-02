const { Router } = require('express');
const { Client } = require('pg');
const router = Router();

const connectionData = {
    user: 'postgres',
    host: 'localhost',
    database: 'prueba',
    password: 'emijuan2308',
    port: 5432, 
  }
  const client = new Client(connectionData)




module.exports = router;