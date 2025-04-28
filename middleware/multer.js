import multer from "multer";

const multerUpload = multer({
    limits: {
        fileSize: 1024 * 1024 * 5, // 2 MB limit
    },
});

export const prescription = multerUpload.single("prescription");
export const billvalidator = multerUpload.single("bill")