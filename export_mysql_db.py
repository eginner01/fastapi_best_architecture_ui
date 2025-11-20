#!/usr/bin/env python3
"""
MySQL 数据库导出工具
导出指定数据库的所有表结构和数据到 SQL 文件
"""
import pymysql
from datetime import datetime
import os

# 数据库配置
DB_CONFIG = {
    'host': '127.0.0.1',
    'port': 3306,
    'user': 'root',
    'password': 'Xuxin@6455141',
    'database': 'fba',
    'charset': 'utf8mb4'
}

# 导出文件名
OUTPUT_FILE = f'fba_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.sql'


def export_database():
    """导出数据库"""
    try:
        # 连接数据库
        print(f"正在连接数据库 {DB_CONFIG['database']}...")
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        with open(OUTPUT_FILE, 'w', encoding='utf8') as f:
            # 写入文件头
            f.write(f"-- MySQL 数据库导出\n")
            f.write(f"-- 数据库: {DB_CONFIG['database']}\n")
            f.write(f"-- 导出时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write(f"SET NAMES utf8mb4;\n")
            f.write(f"SET FOREIGN_KEY_CHECKS = 0;\n\n")
            
            # 获取所有表
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            print(f"找到 {len(tables)} 个表")
            
            for (table_name,) in tables:
                print(f"正在导出表: {table_name}")
                
                # 导出表结构
                f.write(f"-- ----------------------------\n")
                f.write(f"-- 表结构: {table_name}\n")
                f.write(f"-- ----------------------------\n")
                f.write(f"DROP TABLE IF EXISTS `{table_name}`;\n")
                
                cursor.execute(f"SHOW CREATE TABLE `{table_name}`")
                create_table = cursor.fetchone()[1]
                f.write(f"{create_table};\n\n")
                
                # 导出表数据
                cursor.execute(f"SELECT * FROM `{table_name}`")
                rows = cursor.fetchall()
                
                if rows:
                    f.write(f"-- ----------------------------\n")
                    f.write(f"-- 表数据: {table_name}\n")
                    f.write(f"-- ----------------------------\n")
                    
                    # 获取列信息
                    cursor.execute(f"SHOW COLUMNS FROM `{table_name}`")
                    columns = [col[0] for col in cursor.fetchall()]
                    columns_str = ', '.join([f"`{col}`" for col in columns])
                    
                    # 批量插入（每 100 条为一批）
                    batch_size = 100
                    for i in range(0, len(rows), batch_size):
                        batch = rows[i:i + batch_size]
                        f.write(f"INSERT INTO `{table_name}` ({columns_str}) VALUES\n")
                        
                        values_list = []
                        for row in batch:
                            values = []
                            for value in row:
                                if value is None:
                                    values.append('NULL')
                                elif isinstance(value, (int, float)):
                                    values.append(str(value))
                                elif isinstance(value, bytes):
                                    values.append(f"'{value.hex()}'")
                                else:
                                    # 转义特殊字符
                                    value_str = str(value).replace('\\', '\\\\').replace("'", "\\'")
                                    values.append(f"'{value_str}'")
                            values_list.append(f"({', '.join(values)})")
                        
                        f.write(',\n'.join(values_list))
                        f.write(';\n\n')
                    
                    print(f"  导出 {len(rows)} 行数据")
                else:
                    print(f"  表为空")
                
                f.write('\n')
            
            f.write(f"SET FOREIGN_KEY_CHECKS = 1;\n")
        
        cursor.close()
        connection.close()
        
        # 获取文件大小
        file_size = os.path.getsize(OUTPUT_FILE)
        size_mb = file_size / (1024 * 1024)
        
        print(f"\n✅ 导出成功！")
        print(f"📁 文件位置: {os.path.abspath(OUTPUT_FILE)}")
        print(f"📊 文件大小: {size_mb:.2f} MB")
        
    except pymysql.Error as e:
        print(f"❌ 数据库错误: {e}")
    except Exception as e:
        print(f"❌ 导出失败: {e}")


if __name__ == '__main__':
    export_database()
