import express, { Request } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler } from './middlewares/error.middleware'
import cookieParser from 'cookie-parser';

// Component
import userRoutes from "./routes/user.routes"
import authRoutes from "./routes/auth.routes"

dotenv.config()
const app = express()

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}))
app.use(express.json())
app.use(cookieParser());

// test

app.use('/api/users', userRoutes)
app.use('/api/auth', authRoutes)

// Middleware จัดการ Error
app.use(errorHandler)

export default app