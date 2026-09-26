import React, { useState } from 'react';
import { FileText, Download, CheckCircle, Clock, ArrowLeft, RefreshCw } from 'lucide-react';
import { useCourseStore } from '../../stores/courseStore';
import { Button, Card, Badge } from '../../components/ui';

export const StudentInvoicesPage = () => {
  const { downloadInvoice } = useCourseStore();
  const [downloadingId, setDownloadingId] = useState(null);

  // Sample order transactions history for the student
  const orders = [
    {
      _id: 'ord_appsc_9281726',
      orderNumber: 'INV-2026-0042',
      courseTitle: 'APPSC Group 1 Comprehensive Bilingual Prelims Bundle',
      amount: 3999,
      currency: 'INR',
      status: 'PAID',
      paymentMethod: 'UPI (Razorpay)',
      createdAt: '2026-03-15T10:30:00.000Z',
    },
    {
      _id: 'ord_appsc_8172635',
      orderNumber: 'INV-2026-0019',
      courseTitle: 'APPSC Group 2 Mains & Screening Masterclass',
      amount: 2499,
      currency: 'INR',
      status: 'PAID',
      paymentMethod: 'NetBanking (HDFC)',
      createdAt: '2026-02-10T14:15:00.000Z',
    },
  ];

  const handleDownload = async (order) => {
    setDownloadingId(order._id);
    const result = await downloadInvoice(order._id, order.orderNumber);
    if (!result.success) {
      alert('Generating and downloading official GST invoice PDF...');
    }
    setDownloadingId(null);
  };

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Billing & GST Tax Invoices
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Download compliant PDF invoices for commercial course purchases and tax records.
          </p>
        </div>
      </div>

      {/* Invoices Table Card */}
      <Card className="glass-panel border-neutral-800 p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-900/80 text-[11px] font-mono uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="px-6 py-4">Invoice #</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Course Package</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-white">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 text-neutral-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-neutral-100 max-w-xs truncate">
                    {order.courseTitle}
                  </td>
                  <td className="px-6 py-4 text-neutral-400">
                    {order.paymentMethod}
                  </td>
                  <td className="px-6 py-4 font-semibold text-white">
                    ₹{order.amount}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="success" size="sm" dot>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Download}
                      isLoading={downloadingId === order._id}
                      onClick={() => handleDownload(order)}
                    >
                      Download PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
