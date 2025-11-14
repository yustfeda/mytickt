import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 border-t border-gray-700 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-400">
        <p>&copy; {new Date().getFullYear()} TOKOaing. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;