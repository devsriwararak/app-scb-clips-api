import express, { Request } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler } from './middlewares/error.middleware'
import cookieParser from 'cookie-parser';

// Component
import userRoutes from "./routes/user.routes"
import authRoutes from "./routes/auth.routes"
import companyRoutes from "./routes/company.routes"
import locationRoutes from './routes/location.routes'
import lecturerRoutes from './routes/lecturer.routes'
import vdoRoutes from './routes/vdo.routes'
import questionRoutes from './routes/question.routes'
import questionEndRoutes from './routes/questionEnd.routes'
import memberRoutes from './routes/member.routes'
import reportCompany from './routes/report.routes'

dotenv.config()
const app = express()

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser());

// test

app.use('/api/users', userRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/company', companyRoutes)
app.use('/api/location', locationRoutes)
app.use('/api/lecturer', lecturerRoutes)
app.use('/api/vdo', vdoRoutes)
app.use('/api/question', questionRoutes)
app.use('/api/questionEnd', questionEndRoutes)
app.use('/api/member', memberRoutes)
app.use('/api/report', reportCompany)

// Middleware จัดการ Error
app.use(errorHandler)

export default app