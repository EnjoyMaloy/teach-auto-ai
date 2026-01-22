import React, { useState } from 'react';
import { SubBlock, TableCell } from '@/types/designBlock';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Minus, GripVertical } from 'lucide-react';

interface TableEditorProps {
  tableData: TableCell[][];
  tableStyle: 'simple' | 'striped' | 'bordered';
  tableTextSize: 'small' | 'medium' | 'large';
  textAlign: 'left' | 'center' | 'right';
  onUpdate: (updates: Partial<SubBlock>) => void;
  isEditing?: boolean;
}

const MAX_COLUMNS = 4;
const MAX_ROWS = 5;

export const TableEditor: React.FC<TableEditorProps> = ({
  tableData,
  tableStyle,
  tableTextSize,
  textAlign,
  onUpdate,
  isEditing = true,
}) => {
  const rows = tableData.length;
  const cols = tableData[0]?.length || 2;

  const addRow = () => {
    if (rows >= MAX_ROWS) return;
    const newRow = Array.from({ length: cols }, () => ({
      id: crypto.randomUUID(),
      content: '',
    }));
    onUpdate({ tableData: [...tableData, newRow] });
  };

  const removeRow = () => {
    if (rows <= 1) return;
    onUpdate({ tableData: tableData.slice(0, -1) });
  };

  const addColumn = () => {
    if (cols >= MAX_COLUMNS) return;
    const newData = tableData.map(row => [
      ...row,
      { id: crypto.randomUUID(), content: '' },
    ]);
    onUpdate({ tableData: newData });
  };

  const removeColumn = () => {
    if (cols <= 1) return;
    const newData = tableData.map(row => row.slice(0, -1));
    onUpdate({ tableData: newData });
  };

  const updateCell = (rowIdx: number, colIdx: number, content: string) => {
    const newData = tableData.map((row, ri) =>
      row.map((cell, ci) =>
        ri === rowIdx && ci === colIdx ? { ...cell, content } : cell
      )
    );
    onUpdate({ tableData: newData });
  };

  const textSizeClass = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  }[tableTextSize];

  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[textAlign];

  const getTableClasses = () => {
    switch (tableStyle) {
      case 'striped':
        return 'divide-y divide-border';
      case 'bordered':
        return 'border border-border divide-y divide-border';
      default:
        return '';
    }
  };

  const getRowClasses = (idx: number) => {
    if (tableStyle === 'striped' && idx % 2 === 1) {
      return 'bg-muted/30';
    }
    return '';
  };

  const getCellClasses = () => {
    if (tableStyle === 'bordered') {
      return 'border-r border-border last:border-r-0';
    }
    return '';
  };

  return (
    <div className="space-y-3">
      {/* Table preview/editor */}
      <div className={cn('rounded-lg overflow-hidden', getTableClasses())}>
        <table className="w-full">
          <tbody>
            {tableData.map((row, rowIdx) => (
              <tr key={rowIdx} className={getRowClasses(rowIdx)}>
                {row.map((cell, colIdx) => (
                  <td
                    key={cell.id}
                    className={cn(
                      'p-2',
                      textSizeClass,
                      alignClass,
                      getCellClasses(),
                      rowIdx === 0 && 'font-medium bg-muted/50'
                    )}
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        value={cell.content}
                        onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                        className={cn(
                          'w-full bg-transparent outline-none',
                          textSizeClass,
                          alignClass
                        )}
                        placeholder={rowIdx === 0 ? 'Заголовок' : 'Ячейка'}
                      />
                    ) : (
                      cell.content || (rowIdx === 0 ? 'Заголовок' : '—')
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Controls */}
      {isEditing && (
        <div className="space-y-3">
          {/* Row controls */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Строки: {rows}/{MAX_ROWS}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={removeRow}
                disabled={rows <= 1}
                className="h-7 w-7 p-0"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={addRow}
                disabled={rows >= MAX_ROWS}
                className="h-7 w-7 p-0"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Column controls */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Столбцы: {cols}/{MAX_COLUMNS}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={removeColumn}
                disabled={cols <= 1}
                className="h-7 w-7 p-0"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={addColumn}
                disabled={cols >= MAX_COLUMNS}
                className="h-7 w-7 p-0"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableEditor;
