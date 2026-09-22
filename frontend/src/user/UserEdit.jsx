import UserForm from "./UserForm";

function UserEdit({ record, onBack, onComplete, employees = [] }) {
  return <UserForm record={record} onBack={onBack} complete={onComplete} employees={employees} />;
}

export default UserEdit;