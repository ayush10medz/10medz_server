import express from 'express'
import { isAuthenticated } from '../middleware/auth.js'
import { handleConfirmOrder, handleMyOrder, handleOrder } from '../controller/order.js'
import { prescription } from '../middleware/multer.js'

const router = express.Router()

// router.use(isAuthenticated)

router.post("/order",prescription,handleOrder)
router.put("/updateorder/:id",handleConfirmOrder)
router.get("/myorder",handleMyOrder)


export default router