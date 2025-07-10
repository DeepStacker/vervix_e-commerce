import React, { useState, useEffect } from "react";
import axios from "axios";

const CreateProductForm = () => {
  const [formData, setFormData] = useState({
    name: "Classic Cotton Shirt",
    description: "A high-quality cotton shirt for everyday wear.",
    shortDescription: "Premium cotton shirt",
    price: "49.99",
    comparePrice: "59.99",
    costPrice: "30.00",
    sku: "COTTON123",
    barcode: "0123456789012",
    category: ["summer-wear", "shirts"],
    subcategory: "",
    brand: "ClassicWear",
    gender: "men",
    tags: '["cotton", "casual", "summer"]',
    variants: '[{"size":"M","color":"Blue","stock":20,"sku":"COTTON123-M-BLUE"}]',
    inventory: '{"quantity": 20}',
    shipping: '{"weight": 0.5}',
    seo: '{"title": "Cotton Shirt", "description": "Comfortable cotton shirt"}',
    specifications: '[{"name": "Material", "value": "100% Cotton"}]',
    careInstructions: "Machine wash cold, do not bleach",
    materials: '["cotton"]',
    origin: "India"
  });

  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch categories
  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/categories`)
      .then((res) => {
        setCategories(res.data.data || []);
      })
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const token = localStorage.getItem("adminToken");
    if (!token) {
      setMessage({ type: "error", text: "Please login first." });
      setLoading(false);
      return;
    }

    if (!formData.category) {
      setMessage({ type: "error", text: "Please select a category." });
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        data.append(k, v);
      });
      images.forEach((file) => data.append("images", file));

      const res = await axios.post(
        `http://localhost:5000/api/products`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage({ type: "success", text: res.data.message });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to create product"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">Create Product</h2>

      {message && (
        <div
          className={`p-3 mb-4 rounded ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            className="input"
            required
          />
          <input
            name="sku"
            placeholder="SKU"
            value={formData.sku}
            onChange={handleChange}
            className="input"
            required
          />
          <input
            name="price"
            placeholder="Price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            className="input"
            required
          />
          <input
            name="comparePrice"
            placeholder="Compare Price"
            type="number"
            value={formData.comparePrice}
            onChange={handleChange}
            className="input"
          />
          <input
            name="costPrice"
            placeholder="Cost Price"
            type="number"
            value={formData.costPrice}
            onChange={handleChange}
            className="input"
          />
          <input
            name="barcode"
            placeholder="Barcode"
            value={formData.barcode}
            onChange={handleChange}
            className="input"
          />
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="input"
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          <input
            name="subcategory"
            placeholder="Subcategory ID"
            value={formData.subcategory}
            onChange={handleChange}
            className="input"
          />
          <input
            name="brand"
            placeholder="Brand"
            value={formData.brand}
            onChange={handleChange}
            className="input"
          />
          <input
            name="gender"
            placeholder="Gender"
            value={formData.gender}
            onChange={handleChange}
            className="input"
          />
        </div>

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          rows="4"
          className="textarea mt-4 w-full"
        />

        <textarea
          name="shortDescription"
          placeholder="Short Description"
          value={formData.shortDescription}
          onChange={handleChange}
          rows="2"
          className="textarea mt-2 w-full"
        />

        <input
          type="file"
          multiple
          onChange={handleFileChange}
          accept="image/*"
          className="mt-4"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <textarea
            name="tags"
            placeholder='["summer","cotton"]'
            value={formData.tags}
            onChange={handleChange}
            className="textarea w-full"
          />
          <textarea
            name="variants"
            placeholder='[{"size":"M","color":"Blue"}]'
            value={formData.variants}
            onChange={handleChange}
            className="textarea w-full"
          />
          <textarea
            name="inventory"
            placeholder='{"quantity":20}'
            value={formData.inventory}
            onChange={handleChange}
            className="textarea w-full"
          />
          <textarea
            name="shipping"
            placeholder='{"weight":0.5}'
            value={formData.shipping}
            onChange={handleChange}
            className="textarea w-full"
          />
          <textarea
            name="seo"
            placeholder='{"title":"SEO Title"}'
            value={formData.seo}
            onChange={handleChange}
            className="textarea w-full"
          />
          <textarea
            name="specifications"
            placeholder='[{"name":"Material","value":"Cotton"}]'
            value={formData.specifications}
            onChange={handleChange}
            className="textarea w-full"
          />
          <textarea
            name="materials"
            placeholder='["cotton"]'
            value={formData.materials}
            onChange={handleChange}
            className="textarea w-full"
          />
        </div>

        <input
          name="careInstructions"
          placeholder="Care Instructions"
          value={formData.careInstructions}
          onChange={handleChange}
          className="input mt-4 w-full"
        />
        <input
          name="origin"
          placeholder="Made in"
          value={formData.origin}
          onChange={handleChange}
          className="input mt-2 w-full"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Creating..." : "Create Product"}
        </button>
      </form>
    </div>
  );
};

export default CreateProductForm;
