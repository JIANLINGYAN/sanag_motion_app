import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { ParsedResponse } from '@/services/protocolParser';

interface ResponsePanelProps {
  response: ParsedResponse | null;
  onClose: () => void;
}

// 字段名称映射
const labelMap: Record<string, string> = {
  height: '身高',
  weight: '体重',
  weightGrams: '体重(克)',
  age: '年龄',
  gender: '性别',
  genderCode: '性别代码',
  result: '结果',
  resultCode: '结果代码',
  enabled: '启用状态',
  state: '状态',
  interval: '间隔(分钟)',
  distance: '距离(米)',
  distanceKm: '距离(公里)',
  calories: '卡路里(卡)',
  caloriesKcal: '卡路里(大卡)',
  steps: '步数',
  hour: '时',
  minute: '分',
  value: '数值',
  flag: '数据标识',
  flagCode: '数据标识代码',
  totalDuration: '总时长(分钟)',
  totalDurationHours: '总时长(小时)',
  level1: 'Level 1 占比(%)',
  level2: 'Level 2 占比(%)',
  level3: 'Level 3 占比(%)',
  level4: 'Level 4 占比(%)',
  level5: 'Level 5 占比(%)',
  countryCode: '国家代码',
  phoneNumber: '电话号码',
  fullNumber: '完整号码',
  measuring: '测量中',
  status: '状态',
  statusCode: '状态代码',
  startTime: '开始时间',
  sportType: '运动类型',
  sportTypeCode: '运动类型代码',
  duration: '时长(秒)',
  durationFormatted: '时长',
  vo2max: '最大摄氧量',
  fastestPace: '最快配速(m/s)',
  slowestPace: '最慢配速(m/s)',
  averagePace: '平均配速(m/s)',
  minHeartRate: '最低心率',
  maxHeartRate: '最高心率',
  avgHeartRate: '平均心率',
  avgStepFreq: '平均步频',
  aerobicPerformance: '有氧训练表现',
  anaerobicPerformance: '无氧训练表现',
  avgGroundContactTime: '平均触地时间(ms)',
  avgAirTime: '平均腾空时间(ms)',
  avgVerticalAmplitude: '平均垂直振幅(cm)',
  avgBalance: '平均平衡占比(%)',
  recoveryTime: '恢复时长(小时)',
  heartRateZone1: '心率区间1占比(%)',
  heartRateZone2: '心率区间2占比(%)',
  heartRateZone3: '心率区间3占比(%)',
  heartRateZone4: '心率区间4占比(%)',
  heartRateZone5: '心率区间5占比(%)',
  lactateHeartRateZone: '乳酸心率区间占比(%)',
  lactatePaceZone: '乳酸配速区间占比(%)',
  index: '分段索引',
  isLast: '最后一条',
  count: '记录数',
  records: '记录列表',
  day: '日',
  second: '秒',
  heartRate: '心率',
  pace: '配速',
  stepFreq: '步频',
  longitude: '经度',
  latitude: '纬度',
};

export function ResponsePanel({ response, onClose }: ResponsePanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic', 'data']));

  if (!response) return null;

  const toggleSection = (section: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setExpandedSections(newSet);
  };

  const renderValue = (value: unknown): string => {
    if (typeof value === 'boolean') return value ? '是' : '否';
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return `[${value.length} 条记录]`;
    return String(value);
  };

  const SectionHeader = ({ title, section }: { title: string; section: string }) => (
    <button
      onClick={() => toggleSection(section)}
      className="flex items-center justify-between w-full py-2 px-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-gray-500" />
        <span className="font-medium text-sm">{title}</span>
      </div>
      {expandedSections.has(section) ? (
        <ChevronUp className="h-4 w-4 text-gray-400" />
      ) : (
        <ChevronDown className="h-4 w-4 text-gray-400" />
      )}
    </button>
  );

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="py-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base">响应数据解析</CardTitle>
          <Badge variant={response.checksumValid ? 'default' : 'destructive'} className="text-xs">
            {response.checksumValid ? (
              <><CheckCircle className="h-3 w-3 mr-1" />校验通过</>
            ) : (
              <><AlertCircle className="h-3 w-3 mr-1" />校验失败</>
            )}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-3">
            {/* 基本信息 */}
            <div>
              <SectionHeader title="基本信息" section="basic" />
              {expandedSections.has('basic') && (
                <div className="mt-2 px-2">
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-sm text-gray-600">协议头</span>
                    <span className="text-sm font-medium text-gray-900">{response.header}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-sm text-gray-600">字段类型</span>
                    <span className="text-sm font-medium text-gray-900">{response.fieldType} (0x{response.fieldTypeCode.toString(16).toUpperCase()})</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-sm text-gray-600">数据长度</span>
                    <span className="text-sm font-medium text-gray-900">{response.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-sm text-gray-600">类型标识</span>
                    <span className="text-sm font-medium text-gray-900">{response.typeName} (0x{response.typeId.toString(16).toUpperCase()})</span>
                  </div>
                </div>
              )}
            </div>

            {/* 解析数据 */}
            {Object.keys(response.data).filter(k => k !== 'rawData' && k !== 'error').length > 0 && (
              <div>
                <SectionHeader title="解析数据" section="data" />
                {expandedSections.has('data') && (
                  <div className="mt-2 px-2">
                    {Object.entries(response.data)
                      .filter(([key]) => key !== 'rawData' && key !== 'error')
                      .map(([key, value]) => {
                        const label = labelMap[key] || key;
                        return (
                          <div key={key} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                            <span className="text-sm text-gray-600">{label}</span>
                            <span className="text-sm font-medium text-gray-900">{renderValue(value)}</span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* 错误信息 */}
            {response.data.error && (
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">{String(response.data.error)}</span>
                </div>
              </div>
            )}

            {/* 原始数据 */}
            <div>
              <SectionHeader title="原始数据" section="raw" />
              {expandedSections.has('raw') && (
                <div className="mt-2 px-2">
                  <div className="p-2 bg-gray-100 rounded font-mono text-xs break-all">
                    {response.rawData}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
