import React, { useState, useEffect } from "react";
import { db } from "../config/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
} from "firebase/firestore";
import Papa from "papaparse";

const ViewRecords = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  const fetchRecords = async () => {
    try {
      const recordsRef = collection(db, "Records");
      const recordsQuery = query(recordsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(recordsQuery);
      const recordsList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          createdAt:
            data.createdAt?.toDate?.() || new Date(data.createdAt) || null,
        };
      });
      setRecords(recordsList);
      setFilteredRecords(recordsList);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching records:", err);
      setError("Failed to load records.");
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const getTotalQuantity = (products) => {
    if (!Array.isArray(products) || products.length === 0) return "N/A";
    return (
      products.reduce(
        (total, item) => total + parseInt(item.quantity || 0, 10),
        0
      ) || "N/A"
    );
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const handleFilter = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      if (start > end) {
        setError("Start date must be before end date.");
        return;
      }

      const filtered = records.filter((record) => {
        if (!record.createdAt) return false;
        const recordDate = new Date(record.createdAt);
        return recordDate >= start && recordDate <= end;
      });
      setFilteredRecords(filtered);
      setError("");
    } else {
      setFilteredRecords(records);
      setError("");
    }
    setCurrentPage(1);
  };

  const handleClearFilter = () => {
    setStartDate("");
    setEndDate("");
    setFilteredRecords(records);
    setError("");
    setCurrentPage(1);
  };

  const handleDownloadCSV = () => {
    const csvData = filteredRecords.map((record, index) => {
      const productsSummary =
        Array.isArray(record.products) && record.products.length > 0
          ? record.products
              .map(
                (p) =>
                  `${p.productType || "N/A"}: ${p.quantity || 0} (${parseFloat(
                    p.weight || 0
                  ).toFixed(2)} kg)`
              )
              .join("; ")
          : "N/A";

      return {
        No: index + 1,
        ProductType: record.productType || "N/A",
        TotalQuantity: getTotalQuantity(record.products),
        TotalWeight:
          record.products && record.products.length > 0
            ? record.products
                .reduce(
                  (total, item) => total + parseFloat(item.weight || 0),
                  0
                )
                .toFixed(2)
            : "N/A",
        Date: formatDate(record.createdAt),
        DeliveryDate: formatDate(record.deliveryDate),
        NetWeight: record.netWeight
          ? parseFloat(record.netWeight).toFixed(2)
          : "N/A",
        TareWeight: record.tareWeight
          ? parseFloat(record.tareWeight).toFixed(2)
          : "0.00",
        Destination: record.destination || "N/A",
        SenderName: record.senderDetails?.name || "N/A",
        SenderLocation: record.senderDetails?.location || "N/A",
        SenderCompany: record.senderDetails?.company || "N/A",
        SenderJobTitle: record.senderDetails?.jobTitle || "N/A",
        SenderFunctionality: record.senderDetails?.functionality || "N/A",
        ReceiverName: record.receiverDetails?.name || "N/A",
        ReceiverTown: record.receiverDetails?.town || "N/A",
        ReceiverExactLocation: record.receiverDetails?.exactLocation || "N/A",
        VAT: record.vat ? parseFloat(record.vat).toFixed(2) : "N/A",
        AdditionalCharges: record.additionalCharges
          ? parseFloat(record.additionalCharges).toFixed(2)
          : "0.00",
        SpecialInstructions: record.specialInstructions || "N/A",
        TotalAmount: record.totalAmount
          ? parseFloat(record.totalAmount).toFixed(2)
          : "N/A",
        PaymentDate: formatDate(record.paymentDate),
        PaymentTime: record.paymentTime || "N/A",
        PaybillNo: record.paymentDetails?.paybillNo || "N/A",
        AccountNo: record.paymentDetails?.accountNo || "N/A",
        PaymentStatus: record.paymentDetails?.status || "N/A",
        Products: productsSummary,
      };
    });

    const csv =
      "\uFEFF" +
      Papa.unparse(csvData, {
        delimiter: ",",
        quotes: true,
      });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `records_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setUploadError("Please upload a CSV file.");
      return;
    }

    Papa.parse(file, {
      header: true,
      complete: async (result) => {
        try {
          const recordsToAdd = result.data;
          let successCount = 0;

          for (const record of recordsToAdd) {
            if (!record.createdAt || !record.ProductType) continue;

            const products = record.Products ? JSON.parse(record.Products) : [];
            if (!Array.isArray(products)) {
              console.warn(`Invalid products format for record: ${record.No}`);
              continue;
            }

            const newRecord = {
              productType: record.ProductType,
              createdAt: new Date(record.createdAt),
              deliveryDate: record.DeliveryDate
                ? new Date(record.DeliveryDate)
                : null,
              products: products.map((p) => ({
                productType: p.productType || "N/A",
                quantity: parseInt(p.quantity, 10) || 0,
                weight: parseFloat(p.weight) || 0,
                lt: parseFloat(p.lt) || 0,
                wd: parseFloat(p.wd) || 0,
                ht: parseFloat(p.ht) || 0,
                tVol: parseFloat(p.tVol) || 0,
              })),
              netWeight: parseFloat(record.NetWeight) || null,
              tareWeight: parseFloat(record.TareWeight) || 0,
              destination: record.Destination || null,
              vat: parseFloat(record.VAT) || null,
              additionalCharges: parseFloat(record.AdditionalCharges) || 0,
              specialInstructions: record.SpecialInstructions || null,
              totalAmount: parseFloat(record.TotalAmount) || null,
              paymentDate: record.PaymentDate
                ? new Date(record.PaymentDate)
                : null,
              paymentTime: record.PaymentTime || null,
              senderDetails: {
                name: record.SenderName || null,
                location: record.SenderLocation || null,
                company: record.SenderCompany || null,
                jobTitle: record.SenderJobTitle || null,
                functionality: record.SenderFunctionality || null,
              },
              receiverDetails: {
                name: record.ReceiverName || null,
                town: record.ReceiverTown || null,
                exactLocation: record.ReceiverExactLocation || null,
              },
              paymentDetails: {
                paybillNo: record.PaybillNo || null,
                accountNo: record.AccountNo || null,
                status: record.PaymentStatus || null,
              },
            };

            await addDoc(collection(db, "Records"), newRecord);
            successCount++;
          }

          setUploadSuccess(`Successfully uploaded ${successCount} records.`);
          setUploadError("");
          fetchRecords();
        } catch (err) {
          console.error("Error uploading records:", err);
          setUploadError(
            "Failed to upload records. Please check the CSV format."
          );
          setUploadSuccess("");
        }
      },
      error: (err) => {
        console.error("CSV parsing error:", err);
        setUploadError("Error parsing CSV file. Please ensure it is valid.");
        setUploadSuccess("");
      },
    });
  };

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleView = (record) => {
    setSelectedRecord(record);
  };

  const handleClose = () => {
    setSelectedRecord(null);
  };

  return (
    <div className="p-6 min-h-screen bg-[#F9F9F9] font-poppins">
      <h1 className="text-3xl font-bold text-[#0F084B] mb-6">View Records</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {uploadError && <p className="text-red-500 mb-4">{uploadError}</p>}
      {uploadSuccess && <p className="text-green-500 mb-4">{uploadSuccess}</p>}

      <div className="mb-6 flex items-center space-x-4">
        <div>
          <label
            htmlFor="startDate"
            className="mr-2 text-[#0F084B] font-semibold"
          >
            Start Date:
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 border border-[#ddd] rounded-md"
          />
        </div>
        <div>
          <label
            htmlFor="endDate"
            className="mr-2 text-[#0F084B] font-semibold"
          >
            End Date:
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-2 border border-[#ddd] rounded-md"
          />
        </div>
        <button
          onClick={handleFilter}
          className="px-4 py-2 bg-[#0F084B] text-white rounded-md hover:bg-[#0a0638]"
        >
          Apply Filter
        </button>
        <button
          onClick={handleClearFilter}
          className="px-4 py-2 bg-[#FF5733] text-white rounded-md hover:bg-[#e04e2d]"
        >
          Clear Filter
        </button>
      </div>

      <div className="mb-6 flex space-x-4">
        <button
          onClick={handleDownloadCSV}
          className="px-4 py-2 bg-[#2196F3] text-white rounded-md hover:bg-[#1e87d8]"
        >
          Download CSV
        </button>
        <div>
          <label
            htmlFor="csvUpload"
            className="mr-2 text-[#0F084B] font-semibold"
          >
            Upload CSV:
          </label>
          <input
            type="file"
            id="csvUpload"
            accept=".csv"
            onChange={handleUploadCSV}
            className="p-2 border border-[#ddd] rounded-md"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-[#ddd]">
          <thead>
            <tr className="bg-[#0F084B] text-white">
              <th className="p-3 text-left border border-[#ddd]">No</th>
              <th className="p-3 text-left border border-[#ddd]">
                Product Type
              </th>
              <th className="p-3 text-left border border-[#ddd]">
                Total Quantity
              </th>
              <th className="p-3 text-left border border-[#ddd]">
                Total Weight (kg)
              </th>
              <th className="p-3 text-left border border-[#ddd]">Date</th>
              <th className="p-3 text-left border border-[#ddd]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length > 0 ? (
              currentRecords.map((record, index) => (
                <tr key={index} className="border-b border-[#ddd]">
                  <td className="p-3 border border-[#ddd]">
                    {indexOfFirstRecord + index + 1}
                  </td>
                  <td className="p-3 border border-[#ddd]">
                    {record.productType || "N/A"}
                  </td>
                  <td className="p-3 border border-[#ddd]">
                    {getTotalQuantity(record.products)}
                  </td>
                  <td className="p-3 border border-[#ddd]">
                    {record.products && record.products.length > 0
                      ? record.products
                          .reduce(
                            (total, item) =>
                              total + parseFloat(item.weight || 0),
                            0
                          )
                          .toFixed(2) || "N/A"
                      : "N/A"}
                  </td>
                  <td className="p-3 border border-[#ddd]">
                    {formatDate(record.createdAt)}
                  </td>
                  <td className="p-3 border border-[#ddd]">
                    <button
                      onClick={() => handleView(record)}
                      className="text-[#2196F3] hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="p-3 text-center border border-[#ddd]"
                >
                  {startDate || endDate
                    ? "No records found for selected date range."
                    : "No records found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded ${
                  page === currentPage
                    ? "bg-[#0F084B] text-white"
                    : "bg-gray-200"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-[#0F084B] mb-4">
              Record Details
            </h2>
            <div className="mb-4">
              <p>
                <span className="font-semibold">Product Type:</span>{" "}
                {selectedRecord.productType || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Total Quantity:</span>{" "}
                {getTotalQuantity(selectedRecord.products)}
              </p>
              <p>
                <span className="font-semibold">Total Weight:</span>{" "}
                {selectedRecord.products && selectedRecord.products.length > 0
                  ? selectedRecord.products
                      .reduce(
                        (total, item) => total + parseFloat(item.weight || 0),
                        0
                      )
                      .toFixed(2) + " kg"
                  : "N/A"}
              </p>
              <p>
                <span className="font-semibold">Net Weight:</span>{" "}
                {selectedRecord.netWeight || "N/A"} kg
              </p>
              <p>
                <span className="font-semibold">Tare Weight:</span>{" "}
                {selectedRecord.tareWeight || "0.00"} kg
              </p>
              <p>
                <span className="font-semibold">Date:</span>{" "}
                {formatDate(selectedRecord.createdAt)}
              </p>
              <p>
                <span className="font-semibold">Delivery Date:</span>{" "}
                {formatDate(selectedRecord.deliveryDate)}
              </p>
              <p>
                <span className="font-semibold">Destination:</span>{" "}
                {selectedRecord.destination || "N/A"}
              </p>
              <p>
                <span className="font-semibold">VAT:</span>{" "}
                {selectedRecord.vat || "N/A"}%
              </p>
              <p>
                <span className="font-semibold">Additional Charges:</span>{" "}
                {selectedRecord.additionalCharges || "0.00"} KSh
              </p>
              <p>
                <span className="font-semibold">Special Instructions:</span>{" "}
                {selectedRecord.specialInstructions || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Total Amount:</span>{" "}
                {selectedRecord.totalAmount || "N/A"} KSh
              </p>
              <p>
                <span className="font-semibold">Payment Date:</span>{" "}
                {formatDate(selectedRecord.paymentDate)}
              </p>
              <p>
                <span className="font-semibold">Payment Time:</span>{" "}
                {selectedRecord.paymentTime || "N/A"}
              </p>
            </div>
            {selectedRecord.senderDetails && (
              <div className="mb-4">
                <h3 className="font-semibold text-[#0F084B] mb-2">
                  Sender Details:
                </h3>
                <p>
                  <span className="font-semibold">Name:</span>{" "}
                  {selectedRecord.senderDetails.name || "N/A"}
                </p>
                <p>
                  <span className="font-semibold">Location:</span>{" "}
                  {selectedRecord.senderDetails.location || "N/A"}
                </p>
                <p>
                  <span className="font-semibold">Company:</span>{" "}
                  {selectedRecord.senderDetails.company || "N/A"}
                </p>
                <p>
                  <span className="font-semibold">Job Title:</span>{" "}
                  {selectedRecord.senderDetails.jobTitle || "N/A"}
                </p>
                <p>
                  <span className="font-semibold">Functionality:</span>{" "}
                  {selectedRecord.senderDetails.functionality || "N/A"}
                </p>
              </div>
            )}
            {selectedRecord.receiverDetails && (
              <div className="mb-4">
                <h3 className="font-semibold text-[#0F084B] mb-2">
                  Receiver Details:
                </h3>
                <p>
                  <span className="font-semibold">Name:</span>{" "}
                  {selectedRecord.receiverDetails.name || "N/A"}
                </p>
                <p>
                  <span className="font-semibold">Town:</span>{" "}
                  {selectedRecord.receiverDetails.town || "N/A"}
                </p>
                <p>
                  <span className="font-semibold">Exact Location:</span>{" "}
                  {selectedRecord.receiverDetails.exactLocation || "N/A"}
                </p>
              </div>
            )}
            {selectedRecord.paymentDetails && (
              <div className="mb-4">
                <h3 className="font-semibold text-[#0F084B] mb-2">
                  Payment Details:
                </h3>
                <p>
                  <span className="font-semibold">Paybill No:</span>{" "}
                  {selectedRecord.paymentDetails.paybillNo || "N/A"}
                </p>
                <p>
                  <span className="font-semibold">Account No:</span>{" "}
                  {selectedRecord.paymentDetails.accountNo || "N/A"}
                </p>
                <p>
                  <span className="font-semibold">Status:</span>{" "}
                  {selectedRecord.paymentDetails.status || "N/A"}
                </p>
              </div>
            )}
            {selectedRecord.products && selectedRecord.products.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-[#0F084B] mb-2">Products:</h3>
                <ul className="list-disc pl-5">
                  {selectedRecord.products.map((product, index) => (
                    <li key={index} className="mb-1">
                      {`Product: ${product.productType || "N/A"}, Quantity: ${
                        product.quantity || "N/A"
                      }, Weight: ${parseFloat(product.weight || 0).toFixed(
                        2
                      )} kg, Dimensions: ${product.lt || 0} x ${
                        product.wd || 0
                      } x ${product.ht || 0} cm, Total Volume: ${parseFloat(
                        product.tVol || 0
                      ).toFixed(1)} cm³`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={handleClose}
              className="mt-4 px-4 py-2 bg-[#FF5733] text-white rounded-md hover:bg-[#e04e2d]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewRecords;
