import { ArrowUpRight } from 'lucide-react';

const StatisticCard = ({
  title = 'Título',
  value = '0',
  percent = '',
  percentColor = 'text-green-600',
  icon = null,
  bgGradient = 'from-blue-500 to-blue-300',
}) => {
  return (
    <div className="bg-[#f7f9fc] dark:bg-gray-800 rounded-xl p-5 shadow-sm dark:shadow-[0_2px_10px_rgba(219,234,254,0.1)] flex justify-between items-start w-full w-full max-w-sm md:max-w-xs lg:max-w-[360px]">
      <div>
        <p className="text-sm text-gray-500 dark:text-blue-100 font-semibold uppercase tracking-widest">
          {title}
        </p>
        <p className="text-3xl font-bold text-gray-800 dark:text-blue-50 mt-1">
          {value}
        </p>
        {percent && (
          <p className={`flex items-center text-sm mt-2 font-medium ${percentColor}`}>
            <ArrowUpRight className="w-4 h-4 mr-1 dark:text-blue-50" />
            {percent}
          </p>
        )}
      </div>
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${bgGradient} flex items-center justify-center`}>
        {icon ? (
          icon
        ) : (
          <svg
            className="w-5 h-5 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M6 2a1 1 0 000 2h8a1 1 0 100-2H6zM4 6a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
          </svg>
        )}
      </div>
    </div>
  );
};

export default StatisticCard;


















// import { ArrowUpRight } from 'lucide-react';

// const StatisticCard = () => {
//   return (
//     <div className="bg-[#f7f9fc] rounded-xl p-5 shadow-sm flex justify-between items-start w-full max-w-sm mr-5
//                     dark:bg-gray-800"
//     >
//       <div>
//         <p className="text-sm text-gray-500 font-semibold uppercase tracking-widest dark:text-blue-100">
//           Projetos Ativos
//         </p>
//         <p className="text-3xl font-bold text-gray-800 mt-1 dark:text-blue-50">24</p>
//         <p className="flex items-center text-sm text-green-600 mt-2 font-medium">
//           <ArrowUpRight className="w-4 h-4 mr-1 dark:text-blue-50" />
//           12% desde o mês passado
//         </p>
//       </div>
//       <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-300 flex items-center justify-center">
//         {/* Ícone personalizado substituído por um placeholder */}
//         <svg
//           className="w-5 h-5 text-white"
//           fill="currentColor"
//           viewBox="0 0 20 20"
//         >
//           <path d="M6 2a1 1 0 000 2h8a1 1 0 100-2H6zM4 6a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
//         </svg>
//       </div>
//     </div>
//   );
// };

// export default StatisticCard;
