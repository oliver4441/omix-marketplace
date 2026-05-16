import { ReactNode } from 'react'

interface TableProps {
  children: ReactNode
  className?: string
}

export const Table = ({ children, className = '' }: TableProps) => {
  return (
    <table className={`w-full text-sm text-left rtl:text-right border-collapse ${className}`}>
      <thead className="bg-bg">{children}</thead>
    </table>
  )
}

interface TableHeaderProps {
  children: ReactNode
}

export const TableHeader = ({ children }: TableHeaderProps) => {
  return <tr>{children}</tr>
}

interface TableBodyProps {
  children: ReactNode
}

export const TableBody = ({ children }: TableBodyProps) => {
  return <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
}

interface TableRowProps {
  children: ReactNode
  className?: string
}

export const TableRow = ({ children, className = '' }: TableRowProps) => {
  return <tr className={className}>{children}</tr>
}

interface TableHeadProps {
  children: ReactNode
  className?: string
}

export const TableHead = ({ children, className = '' }: TableHeadProps) => {
  return (
    <th
      scope="col"
      className={`px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  )
}

interface TableCellProps {
  children: ReactNode
  className?: string
}

export const TableCell = ({ children, className = '' }: TableCellProps) => {
  return (
    <td className={`px-6 py-4 whitespace-nowrap ${className}`}>
      {children}
    </td>
  )
}
