
import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("crm-token") || "");
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("crm-user") || "null")
  );
  const [mode, setMode] = useState("login");
  const [customers, setCustomers] = useState([]);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(null);

  const [authForm, setAuthForm] = useState({
    name: "", email: "", password: ""
  });
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: ""
  });

  const headers = { Authorization: `Bearer ${token}` };

  async function loadCustomers() {
    try {
      const res = await axios.get(`${API}/customers`, { headers });
      setCustomers(res.data);
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not load customers");
    }
  }

  useEffect(() => {
    if (token) loadCustomers();
  }, [token]);

  async function authenticate(e) {
    e.preventDefault();
    setMessage("");
    try {
      const res = await axios.post(`${API}/auth/${mode}`, authForm);
      if (mode === "register") {
        setMode("login");
        setMessage("Registration successful! Please log in.");
        return;
      }
      localStorage.setItem("crm-token", res.data.token);
      localStorage.setItem("crm-user", JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      setMessage("Login successful");
    } catch (err) {
      setMessage(err.response?.data?.message || "Authentication failed");
    }
  }

  async function saveCustomer(e) {
    e.preventDefault();
    setMessage("");
    try {
      if (editing) {
        await axios.patch(`${API}/customers/${editing}`, form, { headers });
        setMessage("Customer updated");
      } else {
        await axios.post(`${API}/customers`, form, { headers });
        setMessage("Customer added");
      }
      setForm({ name: "", email: "", phone: "", company: "" });
      setEditing(null);
      await loadCustomers();
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not save customer");
    }
  }

  function editCustomer(c) {
    setEditing(c._id);
    setForm({
      name: c.name,
      email: c.email,
      phone: c.phone || "",
      company: c.company || ""
    });
  }

  async function deleteCustomer(id) {
    if (!window.confirm("Delete this customer?")) return;
    try {
      await axios.delete(`${API}/customers/${id}`, { headers });
      setMessage("Customer deleted");
      await loadCustomers();
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not delete customer");
    }
  }

  function logout() {
    localStorage.removeItem("crm-token");
    localStorage.removeItem("crm-user");
    setToken("");
    setUser(null);
    setCustomers([]);
    setMessage("");
  }

  const field =
    "w-full rounded-lg border border-slate-300 px-3 py-2 outline-blue-500";

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center p-5">
        <form onSubmit={authenticate}
          className="w-full max-w-md space-y-4 rounded-2xl bg-white p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-blue-700">ClientFlow CRM</h1>
          <p className="text-slate-500">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </p>
          {mode === "register" && (
            <input className={field} placeholder="Full name" required
              value={authForm.name}
              onChange={e => setAuthForm({...authForm, name:e.target.value})} />
          )}
          <input className={field} type="email" placeholder="Email" required
            value={authForm.email}
            onChange={e => setAuthForm({...authForm, email:e.target.value})} />
          <input className={field} type="password" minLength={6}
            placeholder="Password (minimum 6 characters)" required
            value={authForm.password}
            onChange={e => setAuthForm({...authForm, password:e.target.value})} />
          <button className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">
            {mode === "login" ? "Login" : "Register"}
          </button>
          <button type="button" className="w-full text-blue-700"
            onClick={() => {setMode(mode === "login" ? "register" : "login");setMessage("");}}>
            {mode === "login" ? "Create an account" : "Already registered? Login"}
          </button>
          {message && <p role="status" className="text-sm text-center">{message}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <header className="mx-auto mb-8 flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-blue-800">ClientFlow CRM</h1>
          <p className="text-slate-500">Customer relationship management</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm">{user?.name}</span>
          <button onClick={logout}
            className="rounded-lg border bg-white px-4 py-2">Logout</button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
        <form onSubmit={saveCustomer}
          className="h-fit space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            {editing ? "Edit Customer" : "Add Customer"}
          </h2>
          <input className={field} placeholder="Customer name" required
            value={form.name}
            onChange={e => setForm({...form,name:e.target.value})}/>
          <input className={field} type="email" placeholder="Email" required
            value={form.email}
            onChange={e => setForm({...form,email:e.target.value})}/>
          <input className={field} placeholder="Phone"
            value={form.phone}
            onChange={e => setForm({...form,phone:e.target.value})}/>
          <input className={field} placeholder="Company"
            value={form.company}
            onChange={e => setForm({...form,company:e.target.value})}/>
          <button className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white">
            {editing ? "Update Customer" : "Add Customer"}
          </button>
          {editing && <button type="button" className="w-full text-slate-600"
            onClick={() => {setEditing(null);setForm({name:"",email:"",phone:"",company:""});}}>
            Cancel edit
          </button>}
        </form>

        <section className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold">Customers</h2>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800">
              {customers.length} total
            </span>
          </div>
          {customers.length === 0 ? (
            <p className="py-10 text-center text-slate-500">No customers yet. Add your first customer.</p>
          ) : (
            <div className="space-y-3">
              {customers.map(c => (
                <article key={c._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
                  <div>
                    <h3 className="font-semibold">{c.name}</h3>
                    <p className="text-sm text-slate-500">{c.email}</p>
                    <p className="text-sm text-slate-500">
                      {[c.company,c.phone].filter(Boolean).join(" · ") || "No additional details"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => editCustomer(c)}
                      className="rounded-lg bg-amber-100 px-3 py-2 text-sm">Edit</button>
                    <button onClick={() => deleteCustomer(c._id)}
                      className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
      {message && <p role="status" className="mx-auto mt-5 max-w-6xl text-center">{message}</p>}
    </main>
  );
}
