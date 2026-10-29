const express = require("express");
const Customer = require("../models/Customer");
const auth = require("../middleware/auth");

const router = express.Router();
router.use(auth);

router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 });
    res.json(customers);
  } catch {
    res.status(500).json({ message: "Could not fetch customers" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, email, phone, company } = req.body;

    if (
      typeof name !== "string" || !name.trim() ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return res.status(400).json({
        message: "Customer name and valid email are required",
      });
    }

    const customer = await Customer.create({
      name: name.trim(),
      email: email.trim(),
      phone: typeof phone === "string" ? phone.trim() : "",
      company: typeof company === "string" ? company.trim() : "",
      createdBy: req.user.id,
    });

    res.status(201).json(customer);
  } catch {
    res.status(500).json({ message: "Could not create customer" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const allowed = ["name", "email", "phone", "company"];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (typeof req.body[key] !== "string") {
          return res.status(400).json({ message: `Invalid ${key}` });
        }
        updates[key] = req.body[key].trim();
      }
    }

    if (updates.name !== undefined && !updates.name) {
      return res.status(400).json({ message: "Name cannot be empty" });
    }

    if (
      updates.email !== undefined &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)
    ) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(customer);
  } catch {
    res.status(400).json({ message: "Could not update customer" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer deleted" });
  } catch {
    res.status(400).json({ message: "Could not delete customer" });
  }
});

module.exports = router;