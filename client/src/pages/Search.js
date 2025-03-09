import React from "react";
import Layout from "./../components/Layout";
import { useSearch } from "../context/search";
import { useCart } from "../context/cart";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
const Search = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useCart();
  const [values, setValues] = useSearch();

  // Handle loading and error states
  if (!values) {
    return <div>Loading...</div>;
  }

  // Ensure values.results is defined
  const results = values?.results || [];
  return (
    <Layout title={"Search results"}>
      <div className="container">
        <div className="text-center">
          {/* Fix typo */}
          <h1>Search Results</h1>
          <h6>
            {results.length < 1
              ? "No Products Found"
              : `Found ${results.length}`}
          </h6>
          <div className="d-flex flex-wrap mt-4">
            {values?.results.map((p) => (
              // Unique ID for each product
              <div key={p._id} className="card m-2" style={{ width: "18rem" }}>
                <img
                  src={`/api/v1/product/product-photo/${p._id}`}
                  className="card-img-top"
                  alt={p.name}
                />
                <div className="card-body">
                  <h5 className="card-title">{p.name}</h5>
                  <p className="card-text">
                    {p.description.length > 50
                      ? `${p.description.substring(0, 50)}...`
                      : p.description}
                  </p>
                  <p className="card-text"> $ {p.price}</p>
                  {/* Use 'className' instead of 'class' to avoid syntax error */}
                  <button 
                    className="btn btn-primary ms-1"
                    onClick={() => navigate(`/product/${p.slug}`)}>More Details</button>
                  <button 
                    className="btn btn-secondary ms-1"
                    onClick={() => {
                      setCart([...cart, p]);
                      localStorage.setItem(
                        "cart",
                        JSON.stringify([...cart, p])
                      );
                      toast.success("Item Added to cart");
                    }}>ADD TO CART</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Search;