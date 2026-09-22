import UserForm from "./UserForm";

function UserAdd({ complete, employees = [] }) {
  return <UserForm complete={complete} employees={employees} />;
}

export default UserAdd;
