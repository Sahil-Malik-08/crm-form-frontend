import UserForm from "./UserForm";

function UserAdd({ complete, onBack, employees = [] }) {
  return <UserForm complete={complete} onBack={onBack} employees={employees} />;
}

export default UserAdd;
