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
import { Button, Card, Checkbox, Col, Form, Space, Typography } from 'antd';
import { ReactComponent as EditIcon } from 'assets/svg/edit-new.svg';
import { DE_ACTIVE_COLOR } from 'constants/constants';
import { GlossaryTerm } from 'generated/entity/data/glossaryTerm';
import { t } from 'i18next';
import React, { FC, useState } from 'react';
const { Text } = Typography;

interface GlossaryQuickLinkProps {
  hasEditAccess: boolean;
  isEdit: boolean;
  onQuickLinkUpdate: (data: any) => void;
  updateQuickLink: (quickLink: boolean) => void;
  glossaryTerm: GlossaryTerm;
  onCancel: () => void;
  wrapInCard?: boolean;
}

const GlossaryQuickLink: FC<GlossaryQuickLinkProps> = ({
  hasEditAccess,
  isEdit,
  onQuickLinkUpdate,
  updateQuickLink,
  glossaryTerm,
  onCancel,
  wrapInCard,
}) => {
  const [quickLink, setQuickLink] = useState<boolean>(false);

  const editButton = () => {
    return hasEditAccess ? (
      <Button
        className="cursor-pointer d-inline-flex items-center justify-center"
        data-testid="edit-summary"
        icon={<EditIcon color={DE_ACTIVE_COLOR} width="14px" />}
        size="small"
        type="text"
        onClick={onQuickLinkUpdate}
      />
    ) : (
      <></>
    );
  };

  const handleSave = () => {
    updateQuickLink(quickLink);
  };

  const content = (
    <Col span={24}>
      <Space
        className="schema-description tw-flex"
        direction="vertical"
        size={0}>
        <div className="d-flex items-center">
          <Text className="m-b-0 m-r-xss schema-heading">
            {t('label.quick-link')}
          </Text>
          {editButton()}
        </div>
        <div>
          {isEdit ? (
            <Form.Item
              // label={t('label.quick-link-flag')}
              name="quickLink"
              rules={[{ required: true }]}>
              <Col span={18}>
                <Checkbox
                  checked={quickLink}
                  onChange={(e) => {
                    setQuickLink(e.target.checked);
                  }}>
                  {t('label.quick-link-flag')}
                </Checkbox>
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
          ) : glossaryTerm.quickLink ? (
            <span>{t('label.yes')}</span>
          ) : (
            <span>{t('label.no')}</span>
          )}
        </div>
      </Space>
    </Col>
  );

  return wrapInCard ? <Card>{content}</Card> : content;
};

export default GlossaryQuickLink;
