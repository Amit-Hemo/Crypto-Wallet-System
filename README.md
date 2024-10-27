# Crypto-Balance-System

The system will allow users to manage their crypto holdings and view current valuations built with NestJS.

## Architecture
### ** *Please click on the picture and open the document tab for the approach explanation* **
<a href="https://app.eraser.io/workspace/nCeo9GJ8W4I2jVVdPZst?elements=PsIDxAlSMNf4pEHxKFnT9Q">View on Eraser<br /><img src="https://app.eraser.io/workspace/nCeo9GJ8W4I2jVVdPZst/preview?elements=PsIDxAlSMNf4pEHxKFnT9Q&type=embed" width=750 height=450/></a>

## Project setup

***NOTE: Make sure to have a .env file in apps/rate with keys like in .env.example to make it send requests successfully***

### Compile and run the project locally - MANUAL
- In the microservices main.ts files and modules where HttpModule is registered, replace host value in options to localhost (since this is currently modified for Docker).

```bash
# install dependencies
$ npm install

# Start gateway
$ npm start api-gateway

# Start Microservices
$ npm start balance
$ npm start rate

# Run tests
$ npm test
```

### Compile and run the project at once in Docker environment
- Make sure Docker and docker-compose are installed in your machine
- Run docker engine
- Run the following command:
```bash
$ docker compose up --build
```
*NOTE: You should run tests maunally with npm test for now*

## Documentation
Once the application is running (either ways) you can visit http://localhost:3000/api to see the Swagger interactive interface and docs.
