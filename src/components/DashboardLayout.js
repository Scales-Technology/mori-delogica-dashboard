import Sidebar from './Sidebar';

const DashboardLayout = ({ children }) => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 md:ml-64 p-6 min-h-screen bg-[#F9F9F9] font-poppins">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;