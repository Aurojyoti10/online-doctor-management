const express = require('express');

const router = express.Router();

const {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor
} = require('../controllers/doctorController');
router.get('/', getAllDoctors);
router.get('/:id', getDoctorById);
router.put('/:id', updateDoctor);
router.post('/', createDoctor);
router.delete('/:id', deleteDoctor);

module.exports = router;