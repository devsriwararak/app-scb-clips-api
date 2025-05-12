import app from './app'
import './utils/cleanupVideoTokens'

const PORT = process.env.PORT || 5001

app.listen(PORT, ()=>{
    console.log(`SERVER is PORT : ${PORT}`);
    
})