import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import PaymentModal from '../../components/PaymentModal';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { FiCreditCard } from 'react-icons/fi';


const Credits = () => {
  const [credits, setCredits] = useState(0);
  const [packages, setPackages] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, package: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [creditsRes, packagesRes, transactionsRes] = await Promise.all([
        api.get('/users/credits'),
        api.get('/credits/packages'),
        api.get('/credits/transactions')
      ]);
      setCredits(creditsRes.data.credits);
      setPackages(packagesRes.data);
      setTransactions(transactionsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseClick = (pkg) => {
    setPaymentModal({ isOpen: true, package: pkg });
  };

  const handlePurchase = async (pkg) => {
    try {
      await api.post('/credits/purchase', {
        amount: pkg.amount,
        credits: pkg.credits
      });
      toast.success(`Successfully purchased ${pkg.credits} credits!`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Purchase failed');
      throw error;
    }
  };

  const closePaymentModal = () => {
    setPaymentModal({ isOpen: false, package: null });
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <span className="ml-3 text-secondary-600">Loading...</span>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-6 sm:space-y-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 mb-2">Credit Wallet</h1>
          <p className="text-sm sm:text-base text-secondary-600">Manage your consultation credits and purchase history</p>
        </div>

        <div className="card">
          <div className="card-body p-4 sm:p-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="p-3 sm:p-4 bg-success-100 rounded-full flex-shrink-0">
                <FiCreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-success-600" />
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-secondary-900">{credits}</h2>
                <p className="text-sm sm:text-base text-secondary-600">Available Credits</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-secondary-900">Buy Credits</h2>
            <p className="text-xs sm:text-sm text-secondary-600 mt-1">Purchase credit packages for consultations</p>
          </div>
          <div className="card-body p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {packages.map((pkg, index) => (
                <div key={index} className="card card-hover border-2 border-primary-200">
                  <div className="card-body text-center p-4 sm:p-6">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">💳</div>
                    <h3 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-2">{pkg.credits} Credits</h3>
                    <p className="text-2xl sm:text-3xl font-bold text-primary-600 mb-3 sm:mb-4">${pkg.amount}</p>
                    <button 
                      onClick={() => handlePurchaseClick(pkg)}
                      className="btn btn-primary w-full text-sm sm:text-base"
                    >
                      Purchase
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-secondary-900">Transaction History</h2>
          </div>
          <div className="card-body p-4 sm:p-6">
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl sm:text-6xl mb-4">📋</div>
                <p className="text-sm sm:text-base text-secondary-500">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-secondary-50 rounded-lg border border-secondary-200 gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base font-semibold text-secondary-900 truncate">{transaction.description}</h4>
                      <p className="text-xs sm:text-sm text-secondary-500">{new Date(transaction.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className={`text-base sm:text-lg font-bold ${
                        transaction.credits > 0 ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {transaction.credits > 0 ? '+' : ''}{transaction.credits} credits
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={paymentModal.isOpen}
          onClose={closePaymentModal}
          package={paymentModal.package}
          onSuccess={handlePurchase}
        />
      </div>
    </Layout>
  );
};

export default Credits;
