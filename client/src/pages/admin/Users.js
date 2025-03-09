import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import AdminMenu from "../../components/AdminMenu";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/auth";
import moment from "moment";
import { Select } from "antd";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [auth] = useAuth();

  // Get all users
  const getAllUsers = async () => {
    try {
      const { data } = await axios.get('/api/v1/auth/users');
      if (data) {
        setUsers(data);
      }
    } catch (error) {
      console.log(error);
      toast.error('Error fetching users');
    }
  };

  useEffect(() => {
    if (auth?.token) getAllUsers();
  }, [auth?.token]);

  return (
    <Layout title="Dashboard - All Users">
      <div className="container-fluid m-3 p-3">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <h1>All Users</h1>
            <div className="w-100 overflow-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Phone</th>
                    <th scope="col">Address</th>
                    <th scope="col">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((user, i) => (
                    <tr key={user._id}>
                      <td>{i + 1}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone}</td>
                      <td>{user.address}</td>
                      <td>{user.role === 1 ? 'Admin' : 'User'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default Users;