import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Filter, X } from 'lucide-react';

export interface SearchField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'dateRange' | 'number';
  options?: Array<{ label: string; value: string | number }>;
  placeholder?: string;
}

interface AdvancedSearchProps {
  fields: SearchField[];
  onSearch: (values: Record<string, any>) => void;
  onReset: () => void;
}

export function AdvancedSearch({ fields, onSearch, onReset }: AdvancedSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState<Record<string, any>>({});

  const activeFiltersCount = Object.keys(values).filter(
    key => values[key] !== undefined && values[key] !== ''
  ).length;

  const handleSearch = () => {
    onSearch(values);
    setIsOpen(false);
  };

  const handleReset = () => {
    setValues({});
    onReset();
  };

  const renderField = (field: SearchField) => {
    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <Input
            type={field.type}
            placeholder={field.placeholder || `请输入${field.label}`}
            value={values[field.key] || ''}
            onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
            className="bg-background border-border"
          />
        );

      case 'select':
        return (
          <Select
            value={values[field.key] || ''}
            onValueChange={(value) => setValues({ ...values, [field.key]: value })}
          >
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder={field.placeholder || `请选择${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'dateRange':
        return (
          <div className="flex gap-2">
            <Input
              type="date"
              value={values[`${field.key}_start`] || ''}
              onChange={(e) => setValues({ ...values, [`${field.key}_start`]: e.target.value })}
              className="flex-1 bg-background border-border"
              placeholder="开始日期"
            />
            <span className="flex items-center text-muted-foreground">至</span>
            <Input
              type="date"
              value={values[`${field.key}_end`] || ''}
              onChange={(e) => setValues({ ...values, [`${field.key}_end`]: e.target.value })}
              className="flex-1 bg-background border-border"
              placeholder="结束日期"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-border hover:bg-accent relative"
        >
          <Filter className="w-4 h-4 mr-2" />
          高级搜索
          {activeFiltersCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <div className="bg-card border-border">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">高级搜索</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  {field.label}
                </Label>
                {renderField(field)}
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="border-border"
            >
              重置
            </Button>
            <Button
              size="sm"
              onClick={handleSearch}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              搜索
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
