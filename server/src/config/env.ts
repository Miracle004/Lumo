// import dotenv from 'dotenv';

// dotenv.config();

// const getEnvVar = (name: string): string => {
//   const value = process.env[name];
//   if (!value) {
//     console.error(`FATAL ERROR: Environment variable ${name} is not set.`);
//     process.exit(1);
//   }
//   return value;
// };

// export const config = {
//   jwtSecret: getEnvVar('JWT_SECRET'),
//   jwtExpiresIn: getEnvVar('JWT_EXPIRES_IN'),
//   hederaAccountId: getEnvVar('HEDERA_OPERATOR_ID'),
//   hederaPrivateKey: getEnvVar('HEDERA_OPERATOR_KEY'),
//   port: getEnvVar('DB_PORT'),
//   nodeEnv: getEnvVar('NODE_ENV'),
//   hederaNetwork: getEnvVar('HEDERA_NETWORK'),
// };