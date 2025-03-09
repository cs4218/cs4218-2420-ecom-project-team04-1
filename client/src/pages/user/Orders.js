import React, { useState, useEffect } from "react";
import UserMenu from "../../components/UserMenu";
import Layout from "./../../components/Layout";
import axios from "axios";
import { useAuth } from "../../context/auth";
import moment from "moment";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [auth] = useAuth();

  const getOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get("/api/v1/auth/orders");
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to fetch orders. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.token) getOrders();
  }, [auth?.token]);

  return (
    <Layout title={"Your Orders"}>
      <div className="container-fluid p-4 mr-3 dashboard">
        <div className="row">
          <div className="col-md-3">
            <UserMenu />
          </div>
          <div className="col-md-9">
            <h1 className="text-center">All Orders</h1>
            {loading ? (
              <p className="text-center">Loading...</p>
            ) : error ? (
              <p className="text-center text-danger">{error}</p>
            ) : orders.length === 0 ? (
              <p className="text-center">No orders found.</p>
            ) : (
              orders?.map((o, i) => {
                return (
                  <div className="border shadow" key={o._id}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th scope="col">ID</th>
                          <th scope="col">Status</th>
                          <th scope="col">Buyer</th>
                          <th scope="col">Date</th>
                          <th scope="col">Payment</th>
                          <th scope="col">Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{orders.indexOf(o) + 1}</td>
                          <td>{o?.status}</td>
                          <td>{o?.buyer?.name}</td>
                          <td>{moment(o?.createdAt).fromNow()}</td>
                          <td>{o?.payment.success ? "Success" : "Failed"}</td>
                          <td>{o?.products?.length || 0}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="container">
                      {o?.products?.map((p) => (
                        <div className="row m-3 p-3 card flex-row" key={p._id}>
                          <div className="col-md-3">
                            <img
                              src={`/api/v1/product/product-photo/${p._id}`}
                              className="card-img-top"
                              alt={p.name}
                              width="100px"
                              height={"100px"}
                            />
                          </div>
                          <div className="col-md-8">
                            <p>{p.name}</p>
                            <p>
                              {p.description.length > 200
                                ? `${p.description.substring(0, 200)}...`
                                : p.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
  
              })
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Orders;