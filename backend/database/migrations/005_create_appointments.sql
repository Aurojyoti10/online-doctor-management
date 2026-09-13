CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,

    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    status ENUM(
        'scheduled',
        'confirmed',
        'completed',
        'cancelled',
        'no_show'
    ) DEFAULT 'scheduled',

    reason VARCHAR(500),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_appointment_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_appointment_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_doctor_appointment
        UNIQUE (doctor_id, appointment_date, start_time)
);