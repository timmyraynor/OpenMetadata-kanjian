/*
 *  Copyright 2022 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Select, Space, Typography } from 'antd';
import { ReactComponent as EditIcon } from 'assets/svg/edit-new.svg';
import { DE_ACTIVE_COLOR } from 'constants/constants';
import { GlossaryTerm } from 'generated/entity/data/glossaryTerm';
import { Level } from 'generated/type/schema';
import { t } from 'i18next';
import React, { FC, useState } from 'react';
import { getLevelName, glossaryTermLevelOptions } from 'utils/GlossaryUtils';
const { Text } = Typography;

interface GlossaryHierarchyProps {
  hasEditAccess: boolean;
  isEdit: boolean;
  onHierarchyUpdate: (data: any) => void;
  updateHierarchy: (level: Level) => void;
  glossaryTerm: GlossaryTerm;
  onCancel: () => void;
  wrapInCard?: boolean;
}

const GlossaryHierarchy: FC<GlossaryHierarchyProps> = ({
  hasEditAccess,
  isEdit,
  onHierarchyUpdate,
  updateHierarchy,
  glossaryTerm,
  onCancel,
  wrapInCard,
}) => {
  const [selectedTerm, setSelectedTerm] = useState<Level>(Level.Term);

  const editButton = () => {
    return hasEditAccess ? (
      <Button
        className="cursor-pointer d-inline-flex items-center justify-center"
        data-testid="edit-summary"
        icon={<EditIcon color={DE_ACTIVE_COLOR} width="14px" />}
        size="small"
        type="text"
        onClick={onHierarchyUpdate}
      />
    ) : (
      <></>
    );
  };

  const handleSave = () => {
    updateHierarchy(selectedTerm);
  };

  const content = (
    <Col span={24}>
      <Space
        className="schema-description tw-flex"
        direction="vertical"
        size={0}>
        <div className="d-flex items-center">
          <Text className="m-b-0 m-r-xss schema-heading">
            {t('label.level')}
          </Text>
          {editButton()}
        </div>
        <div>
          {isEdit ? (
            <Form.Item
              label={t('label.level')}
              name="level"
              rules={[{ required: true }]}>
              <Col span={18}>
                <Select
                  defaultValue={glossaryTerm.level}
                  options={glossaryTermLevelOptions()}
                  placeholder={t('label.level')}
                  onChange={(_, data) => {
                    if (Array.isArray(data)) {
                      // single option should always be one
                    } else {
                      // Handle the single object case
                      const opt: { value: any; label: string; key: number } =
                        data;
                      setSelectedTerm(opt.value);
                    }
                  }}
                />
              </Col>
              <Col span={6}>
                {hasEditAccess ? (
                  <div>
                    <Button
                      className="p-x-05"
                      data-testid="cancelHierarchyUpdate"
                      icon={<CloseOutlined size={12} />}
                      size="small"
                      onClick={onCancel}
                    />
                    <Button
                      className="p-x-05"
                      data-testid="saveHierarchyUpdate"
                      icon={<CheckOutlined size={12} />}
                      size="small"
                      type="primary"
                      onClick={handleSave}
                    />
                  </div>
                ) : (
                  <></>
                )}
              </Col>
            </Form.Item>
          ) : glossaryTerm ? (
            <span>{getLevelName(glossaryTerm?.level || Level.Term)}</span>
          ) : (
            <span>{t('label.none')}</span>
          )}
        </div>
      </Space>
    </Col>
  );

  return wrapInCard ? <Card>{content}</Card> : content;
};

export default GlossaryHierarchy;
