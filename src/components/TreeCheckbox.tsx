import { useState, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, ChevronDown } from "lucide-react";

export interface TreeNode {
  id: number;
  title: string;
  children?: TreeNode[];
  [key: string]: any;
}

interface TreeCheckboxProps {
  data: TreeNode[];
  checkedKeys: number[];
  onCheckedChange: (checkedKeys: number[]) => void;
  checkStrictly?: boolean; // 是否父子独立
  defaultExpandAll?: boolean;
  labelField?: string;
}

export default function TreeCheckbox({
  data,
  checkedKeys,
  onCheckedChange,
  checkStrictly = false,
  defaultExpandAll = false,
  labelField = 'title',
}: TreeCheckboxProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<number>>(new Set());
  const [internalCheckedKeys, setInternalCheckedKeys] = useState<Set<number>>(new Set(checkedKeys));

  useEffect(() => {
    setInternalCheckedKeys(new Set(checkedKeys));
  }, [checkedKeys]);

  useEffect(() => {
    if (defaultExpandAll) {
      const allKeys = new Set<number>();
      const collectKeys = (nodes: TreeNode[]) => {
        nodes.forEach(node => {
          allKeys.add(node.id);
          if (node.children && node.children.length > 0) {
            collectKeys(node.children);
          }
        });
      };
      collectKeys(data);
      setExpandedKeys(allKeys);
    }
  }, [data, defaultExpandAll]);

  // 获取所有子节点ID
  const getAllChildrenIds = (node: TreeNode): number[] => {
    let ids: number[] = [node.id];
    if (node.children) {
      node.children.forEach(child => {
        ids = ids.concat(getAllChildrenIds(child));
      });
    }
    return ids;
  };

  // 获取所有父节点ID
  const getParentIds = (nodeId: number, nodes: TreeNode[], parentIds: number[] = []): number[] => {
    for (const node of nodes) {
      if (node.id === nodeId) {
        return parentIds;
      }
      if (node.children) {
        const found = getParentIds(nodeId, node.children, [...parentIds, node.id]);
        if (found.length > parentIds.length || found.some(id => id === nodeId)) {
          return found;
        }
      }
    }
    return parentIds;
  };

  // 检查是否半选状态
  const isIndeterminate = (node: TreeNode): boolean => {
    if (!node.children || node.children.length === 0 || checkStrictly) return false;
    
    const childrenIds = node.children.map(c => c.id);
    const checkedChildren = childrenIds.filter(id => internalCheckedKeys.has(id));
    
    return checkedChildren.length > 0 && checkedChildren.length < childrenIds.length;
  };

  // 处理复选框变化
  const handleCheckChange = (node: TreeNode, checked: boolean) => {
    const newCheckedKeys = new Set(internalCheckedKeys);

    if (checkStrictly) {
      // 父子独立模式
      if (checked) {
        newCheckedKeys.add(node.id);
      } else {
        newCheckedKeys.delete(node.id);
      }
    } else {
      // 父子联动模式
      const childrenIds = getAllChildrenIds(node);
      if (checked) {
        childrenIds.forEach(id => newCheckedKeys.add(id));
        // 检查是否需要选中父节点
        const parentIds = getParentIds(node.id, data);
        parentIds.forEach(parentId => {
          const parent = findNodeById(data, parentId);
          if (parent && parent.children) {
            const allChildrenChecked = parent.children.every(c => 
              childrenIds.includes(c.id) || newCheckedKeys.has(c.id)
            );
            if (allChildrenChecked) {
              newCheckedKeys.add(parentId);
            }
          }
        });
      } else {
        childrenIds.forEach(id => newCheckedKeys.delete(id));
        // 取消选中父节点
        const parentIds = getParentIds(node.id, data);
        parentIds.forEach(id => newCheckedKeys.delete(id));
      }
    }

    setInternalCheckedKeys(newCheckedKeys);
    onCheckedChange(Array.from(newCheckedKeys));
  };

  // 查找节点
  const findNodeById = (nodes: TreeNode[], id: number): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // 切换展开状态
  const toggleExpand = (nodeId: number) => {
    const newExpandedKeys = new Set(expandedKeys);
    if (newExpandedKeys.has(nodeId)) {
      newExpandedKeys.delete(nodeId);
    } else {
      newExpandedKeys.add(nodeId);
    }
    setExpandedKeys(newExpandedKeys);
  };

  // 渲染树节点
  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedKeys.has(node.id);
    const isChecked = internalCheckedKeys.has(node.id);
    const isIndeter = isIndeterminate(node);

    return (
      <div key={node.id} className="select-none">
        <div 
          className="flex items-center py-2 px-2 hover:bg-accent/50 rounded-md transition-colors group"
          style={{ paddingLeft: `${level * 24 + 8}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(node.id)}
              className="mr-1 p-0.5 hover:bg-accent rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <span className="w-5 mr-1" />
          )}
          
          <Checkbox
            checked={isChecked}
            // @ts-ignore - indeterminate 属性确实存在
            indeterminate={isIndeter}
            onCheckedChange={(checked) => handleCheckChange(node, checked as boolean)}
            className="mr-2"
          />
          
          <span className="text-sm text-foreground flex-1">
            {node[labelField] || node.title}
          </span>

          {node.type !== undefined && (
            <span className={`text-xs px-2 py-0.5 rounded ${
              node.type === 0 ? 'bg-orange-500/10 text-orange-500' :
              node.type === 1 ? 'bg-blue-500/10 text-blue-500' :
              node.type === 2 ? 'bg-green-500/10 text-green-500' :
              'bg-muted text-muted-foreground'
            }`}>
              {node.type === 0 ? '目录' : node.type === 1 ? '菜单' : node.type === 2 ? '按钮' : '其他'}
            </span>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {data.map(node => renderTreeNode(node))}
    </div>
  );
}

// 工具函数：展开所有节点
export const getAllTreeNodeIds = (nodes: TreeNode[]): number[] => {
  let ids: number[] = [];
  nodes.forEach(node => {
    ids.push(node.id);
    if (node.children && node.children.length > 0) {
      ids = ids.concat(getAllTreeNodeIds(node.children));
    }
  });
  return ids;
};
