"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, Download, ChevronLeft, ChevronRight } from 'lucide-react';

const RevenueByDMC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('revenue');
  const [currentPage, setCurrentPage] = useState(1);
  const [, setIsClient] = useState(false);
  const itemsPerPage = 3;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const dmcData = useMemo(() => [
    {
      dmcName: 'Lotus Path Tours',
      itineraries: 18,
      totalRevenue: '$52,000',
      paymentToDmc: '$41,000',
      agencyCommission: '$11,000'
    },
    {
      dmcName: 'Himalayan Connect',
      itineraries: 14,
      totalRevenue: '$38,600',
      paymentToDmc: '$30,400',
      agencyCommission: '$8,200'
    },
    {
      dmcName: 'South Escape Travel',
      itineraries: 11,
      totalRevenue: '$31,900',
      paymentToDmc: '$25,500',
      agencyCommission: '$6,400'
    }
  ], []);

  const sortedAndFilteredData = useMemo(() => {
    const filtered = dmcData.filter(item =>
      item.dmcName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      if (sortBy === 'revenue') {
        const revenueA = parseFloat(a.totalRevenue.replace(/[^0-9.-]+/g,""));
        const revenueB = parseFloat(b.totalRevenue.replace(/[^0-9.-]+/g,""));
        return revenueB - revenueA;
      }
      if (sortBy === 'dmc') {
        return a.dmcName.localeCompare(b.dmcName);
      }
      if (sortBy === 'itineraries') {
        return b.itineraries - a.itineraries;
      }
      if (sortBy === 'commission') {
        const commA = parseFloat(a.agencyCommission.replace(/[^0-9.-]+/g,""));
        const commB = parseFloat(b.agencyCommission.replace(/[^0-9.-]+/g,""));
        return commB - commA;
      }
      return 0;
    });
  }, [searchTerm, sortBy, dmcData]);


  const totalPages = Math.ceil(sortedAndFilteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sortedAndFilteredData.slice(startIndex, endIndex);

  const renderPaginationButtons = () => {
    const pages = [];
    
    if (totalPages > 1) {
      if (currentPage > 1) {
        pages.push(
          <button 
            key="prev" 
            onClick={() => setCurrentPage(currentPage - 1)} 
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        );
      }

      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`px-3 py-1 ${i === currentPage ? 'bg-green-500 text-white rounded' : 'text-gray-600 hover:text-gray-800'} transition-colors`}
          >
            {i}
          </button>
        );
      }

      if (currentPage < totalPages) {
        pages.push(
          <button 
            key="next" 
            onClick={() => setCurrentPage(currentPage + 1)} 
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        );
      }
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-0 sm:p-4">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="w-full sm:w-auto sm:flex-1">
              <div className="relative max-w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search DMCs..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-normal">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="revenue">Revenue</option>
                  <option value="dmc">DMC Name</option>
                  <option value="itineraries">Itineraries</option>
                  <option value="commission">Commission</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <button 
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                aria-label="Download data"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="px-2 sm:px-4 py-3 text-left w-10 sm:w-12">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300" 
                  />
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                  DMC Name
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                  Itineraries
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                  Total revenue
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                  Payment to DMC
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                  Agency Commission
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-2 sm:px-4 py-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300" 
                      />
                    </td>
                    <td className="px-2 sm:px-4 py-4">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">{item.dmcName}</div>
                    </td>
                    <td className="px-2 sm:px-4 py-4">
                      <div className="text-xs sm:text-sm text-gray-700">{item.itineraries}</div>
                    </td>
                    <td className="px-2 sm:px-4 py-4">
                      <div className="text-xs sm:text-sm text-gray-900">{item.totalRevenue}</div>
                    </td>
                    <td className="px-2 sm:px-4 py-4">
                      <div className="text-xs sm:text-sm text-gray-700">{item.paymentToDmc}</div>
                    </td>
                    <td className="px-2 sm:px-4 py-4">
                      <div className="text-xs sm:text-sm text-gray-900">{item.agencyCommission}</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    No DMCs found matching your search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, sortedAndFilteredData.length)}</span> of{' '}
              <span className="font-medium">{sortedAndFilteredData.length}</span> results
            </div>
            <div className="flex items-center space-x-1 overflow-x-auto">
              {renderPaginationButtons()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueByDMC;