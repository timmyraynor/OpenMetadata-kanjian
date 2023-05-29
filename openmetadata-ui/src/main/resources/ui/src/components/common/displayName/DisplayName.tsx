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
import { Button, Col, Row, Select, Tooltip } from 'antd';
import { ReactComponent as EditIcon } from 'assets/svg/edit-new.svg';
import { AxiosError } from 'axios';
import { Table } from 'generated/entity/data/table';
import { isFunction } from 'lodash';
import { EntityTags } from 'Models';
import React, { FC, useState } from 'react';
import { ThreadType } from '../../../generated/entity/feed/thread';
import { EntityFieldThreads } from '../../../interface/feed.interface';
import { showErrorToast } from '../../../utils/ToastUtils';
const { Option } = Select;

export interface DisplayNameProps {
  entityName?: string;
  owner?: Table['owner'];
  hasEditAccess?: boolean;
  removeBlur?: boolean;
  displayName?: string;
  isEdit?: boolean;
  isReadOnly?: boolean;
  entityType?: string;
  entityFqn?: string;
  entityFieldThreads?: EntityFieldThreads[];
  entityFieldTasks?: EntityFieldThreads[];
  onThreadLinkSelect?: (value: string, threadType?: ThreadType) => void;
  onDisplayNameEdit?: () => void;
  onCancel?: () => void;
  onDisplayNameUpdate?: (value: string) => void;
  onSuggest?: (value: string) => void;
  displayNameOptions?: Array<EntityTags>;
}

const DisplayName: FC<DisplayNameProps> = ({
  hasEditAccess,
  displayName = '',
  isEdit,
  onDisplayNameUpdate,
  onDisplayNameEdit,
  displayNameOptions,
  onCancel,
}) => {
  const [updateName, setUpdateName] = useState<string>(displayName);

  const handleSave: React.MouseEventHandler<HTMLElement> = async () => {
    await handleSaveLogic(updateName);
  };

  const handleSaveLogic = async (updatedDisplayName: string) => {
    if (onDisplayNameUpdate && isFunction(onDisplayNameUpdate)) {
      try {
        await onDisplayNameUpdate(updatedDisplayName);

        onCancel && onCancel();
      } catch (error) {
        showErrorToast(error as AxiosError);
      }
    }
  };

  const options =
    displayNameOptions?.map((item: EntityTags) => {
      return item.tagFQN.substring(item.tagFQN.lastIndexOf('.') + 1);
    }) ?? Array<string>();
  const handleSelect = (value: string) => {
    setUpdateName(value);
  };

  return (
    <>
      {isEdit ? (
        <>
          <Select
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)
                .toLowerCase()
                .indexOf(input.toLowerCase()) >= 0
            }
            optionFilterProp="children"
            placeholder="Select an option or type"
            style={{ width: 200 }}
            onSelect={handleSelect}>
            {options.length > 0
              ? options.map((option) => (
                  <Option key={option ?? ''} value={option}>
                    {option}
                  </Option>
                ))
              : null}
          </Select>
          <Button
            className="p-x-05"
            data-testid="cancelAssociatedTag"
            icon={<CloseOutlined size={12} />}
            size="small"
            onClick={onCancel}
          />
          <Button
            className="p-x-05"
            data-testid="saveAssociatedTag"
            icon={<CheckOutlined size={12} />}
            size="small"
            type="primary"
            onClick={handleSave}
          />
        </>
      ) : (
        <Row>
          <Col>{displayName ?? name}</Col>
          {hasEditAccess ? (
            <Col>
              <Tooltip placement="topRight">
                <Button
                  className="flex-center p-0"
                  data-testid="edit-owner"
                  icon={<EditIcon width="14px" />}
                  size="small"
                  title="Update Display Name"
                  type="text"
                  onClick={onDisplayNameEdit}
                />
              </Tooltip>
            </Col>
          ) : null}
        </Row>
      )}
    </>
  );
};

export default DisplayName;
