import EmployeeForm from "./EmployeeForm";

function EmployeeEdit({ record, onBack, onComplete }) {
  return <EmployeeForm record={record} onBack={onBack} onComplete={onComplete} />;
}

export default EmployeeEdit;

