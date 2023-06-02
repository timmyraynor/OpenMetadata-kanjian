/*
 *  Copyright 2023 Collate.
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

import {
  BlockOutlined,
  BookOutlined,
  FolderOpenOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  Modal,
  Row,
  Space,
  Table,
  TableProps,
  Tooltip,
} from 'antd';
import { ColumnsType, ExpandableConfig } from 'antd/lib/table/interface';
import { ReactComponent as EditIcon } from 'assets/svg/edit-new.svg';
import { ReactComponent as DownUpArrowIcon } from 'assets/svg/ic-down-up-arrow.svg';
import { ReactComponent as UpDownArrowIcon } from 'assets/svg/ic-up-down-arrow.svg';
import { ReactComponent as PlusOutlinedIcon } from 'assets/svg/plus-outlined.svg';
import { AxiosError } from 'axios';
import ErrorPlaceHolder from 'components/common/error-with-placeholder/ErrorPlaceHolder';
import RichTextEditorPreviewer from 'components/common/rich-text-editor/RichTextEditorPreviewer';
import Loader from 'components/Loader/Loader';
import { DE_ACTIVE_COLOR } from 'constants/constants';
import { GLOSSARIES_DOCS } from 'constants/docs.constants';
import { TABLE_CONSTANTS } from 'constants/Teams.constants';
import { ERROR_PLACEHOLDER_TYPE } from 'enums/common.enum';
import { compare } from 'fast-json-patch';
import { GlossaryTerm } from 'generated/entity/data/glossaryTerm';
import { Level } from 'generated/type/tagLabel';
import { isEmpty } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { patchGlossaryTerm } from 'rest/glossaryAPI';
import { Transi18next } from 'utils/CommonUtils';
import { getEntityName } from 'utils/EntityUtils';
import { buildTree, getLevelName } from 'utils/GlossaryUtils';
import { getGlossaryPath } from 'utils/RouterUtils';
import { getTableExpandableConfig } from 'utils/TableUtils';
import { showErrorToast } from 'utils/ToastUtils';
import {
  DraggableBodyRowProps,
  GlossaryTermTabProps,
  ModifiedGlossaryTerm,
  MoveGlossaryTermType,
} from './GlossaryTermTab.interface';

const GlossaryTermTab = ({
  childGlossaryTerms = [],
  refreshGlossaryTerms,
  permissions,
  isGlossary,
  selectedData,
  termsLoading,
  onAddGlossaryTerm,
  onEditGlossaryTerm,
}: GlossaryTermTabProps) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [glossaryTerms, setGlossaryTerms] = useState<ModifiedGlossaryTerm[]>(
    []
  );
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [movedGlossaryTerm, setMovedGlossaryTerm] =
    useState<MoveGlossaryTermType>();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isTableLoading, setIsTableLoading] = useState(false);

  const getEntityTermIcon = (data: GlossaryTerm) => {
    switch (data.level) {
      case Level.Domain:
        return <FolderOpenOutlined />;
      case Level.Subdomain:
        return <BlockOutlined />;
      case Level.Metric:
        return <RiseOutlined />;
      case Level.Term:
        return <BookOutlined />;
      default:
        return <BookOutlined />;
    }
  };

  const columns = useMemo(() => {
    const data: ColumnsType<ModifiedGlossaryTerm> = [
      {
        title: t('label.term-plural'),
        dataIndex: 'name',
        key: 'name',
        className: 'glossary-name-column',
        render: (_, record) => {
          const name = getEntityName(record);
          const icon = getEntityTermIcon(record as GlossaryTerm);

          return (
            <Link
              className="hover:tw-underline tw-cursor-pointer help-text"
              data-testid={name}
              to={getGlossaryPath(record.fullyQualifiedName || record.name)}>
              {icon} {name}
            </Link>
          );
        },
      },
      {
        title: t('label.level'),
        dataIndex: 'level',
        key: 'level',
        render: (level: Level) =>
          level ? (
            getLevelName(level)
          ) : (
            <span className="tw-no-level">{t('label.none')}</span>
          ),
      },
      {
        title: t('label.description'),
        dataIndex: 'description',
        key: 'description',
        render: (description: string) =>
          description.trim() ? (
            <RichTextEditorPreviewer
              enableSeeMoreVariant
              markdown={description}
              maxLength={120}
            />
          ) : (
            <span className="tw-no-description">
              {t('label.no-description')}
            </span>
          ),
      },
    ];
    if (permissions.Create) {
      data.push({
        title: t('label.action-plural'),
        key: 'new-term',
        render: (_, record) => (
          <div className="d-flex items-center">
            <Tooltip
              title={t('label.add-entity', {
                entity: t('label.glossary-term'),
              })}>
              <Button
                className="add-new-term-btn text-grey-muted flex-center"
                data-testid="add-classification"
                icon={<PlusOutlinedIcon color={DE_ACTIVE_COLOR} width="14px" />}
                size="small"
                type="text"
                onClick={() => {
                  onAddGlossaryTerm(record as GlossaryTerm);
                }}
              />
            </Tooltip>
            <Tooltip
              title={t('label.edit-entity', {
                entity: t('label.glossary-term'),
              })}>
              <Button
                className="cursor-pointer flex-center"
                data-testid="edit-button"
                icon={<EditIcon color={DE_ACTIVE_COLOR} width="14px" />}
                size="small"
                type="text"
                onClick={() => onEditGlossaryTerm(record as GlossaryTerm)}
              />
            </Tooltip>
          </div>
        ),
      });
    }

    return data;
  }, [glossaryTerms]);

  const handleAddGlossaryTermClick = () => {
    onAddGlossaryTerm(!isGlossary ? (selectedData as GlossaryTerm) : undefined);
  };

  const expandableConfig: ExpandableConfig<ModifiedGlossaryTerm> = useMemo(
    () => ({
      ...getTableExpandableConfig<ModifiedGlossaryTerm>(true),
      expandedRowKeys,
      onExpand: (expanded, record) => {
        setExpandedRowKeys(
          expanded
            ? [...expandedRowKeys, record.fullyQualifiedName || '']
            : expandedRowKeys.filter((key) => key !== record.fullyQualifiedName)
        );
      },
    }),
    [expandedRowKeys]
  );

  const handleMoveRow = useCallback(
    async (dragRecord: GlossaryTerm, dropRecord: GlossaryTerm) => {
      if (dragRecord.id === dropRecord.id) {
        return;
      }

      setMovedGlossaryTerm({
        from: dragRecord,
        to: dropRecord,
      });
      setIsModalOpen(true);
    },
    []
  );

  const handleChangeGlossaryTerm = async () => {
    if (movedGlossaryTerm) {
      setIsTableLoading(true);
      const newTermData = {
        ...movedGlossaryTerm.from,
        parent: {
          fullyQualifiedName: movedGlossaryTerm.to.fullyQualifiedName,
        },
      };
      const jsonPatch = compare(movedGlossaryTerm.from, newTermData);

      try {
        await patchGlossaryTerm(movedGlossaryTerm.from?.id || '', jsonPatch);
        refreshGlossaryTerms && refreshGlossaryTerms();
      } catch (error) {
        showErrorToast(error as AxiosError);
      } finally {
        setIsTableLoading(false);
        setIsModalOpen(false);
      }
    }
  };

  const onTableRow: TableProps<ModifiedGlossaryTerm>['onRow'] = (
    record,
    index
  ) => {
    const attr = {
      index,
      handleMoveRow,
      record,
    };

    return attr as DraggableBodyRowProps;
  };

  const toggleExpandAll = () => {
    if (expandedRowKeys.length === childGlossaryTerms.length) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(
        childGlossaryTerms.map((item) => item.fullyQualifiedName || '')
      );
    }
  };

  useEffect(() => {
    if (childGlossaryTerms) {
      const data = buildTree(childGlossaryTerms);
      setGlossaryTerms(data as ModifiedGlossaryTerm[]);
      setExpandedRowKeys(
        childGlossaryTerms.map((item) => item.fullyQualifiedName || '')
      );
    }
    setIsLoading(false);
  }, [childGlossaryTerms]);

  if (termsLoading || isLoading) {
    return <Loader />;
  }

  if (isEmpty(glossaryTerms)) {
    return (
      <ErrorPlaceHolder
        className="m-t-xlg"
        doc={GLOSSARIES_DOCS}
        heading={t('label.glossary-term')}
        permission={permissions.Create}
        type={ERROR_PLACEHOLDER_TYPE.CREATE}
        onClick={handleAddGlossaryTermClick}
      />
    );
  }

  return (
    <Row gutter={[0, 16]}>
      <Col span={24}>
        <div className="d-flex justify-end">
          <Button
            className="tw-text-primary tw-rounded m-b-sm"
            size="small"
            type="text"
            onClick={toggleExpandAll}>
            <Space align="center" size={4}>
              {expandedRowKeys.length === childGlossaryTerms.length ? (
                <DownUpArrowIcon color={DE_ACTIVE_COLOR} height="14px" />
              ) : (
                <UpDownArrowIcon color={DE_ACTIVE_COLOR} height="14px" />
              )}

              {expandedRowKeys.length === childGlossaryTerms.length
                ? t('label.collapse-all')
                : t('label.expand-all')}
            </Space>
          </Button>
        </div>

        {glossaryTerms.length > 0 ? (
          <DndProvider backend={HTML5Backend}>
            <Table
              bordered
              className="drop-over-background"
              columns={columns}
              components={TABLE_CONSTANTS}
              dataSource={glossaryTerms}
              expandable={expandableConfig}
              loading={isTableLoading}
              pagination={false}
              rowKey="fullyQualifiedName"
              scroll={{ x: true }}
              size="small"
              tableLayout="auto"
              onRow={onTableRow}
            />
          </DndProvider>
        ) : (
          <ErrorPlaceHolder />
        )}
        <Modal
          centered
          destroyOnClose
          closable={false}
          confirmLoading={isTableLoading}
          data-testid="confirmation-modal"
          maskClosable={false}
          okText={t('label.confirm')}
          open={isModalOpen}
          title={t('label.move-the-entity', {
            entity: t('label.glossary-term'),
          })}
          onCancel={() => setIsModalOpen(false)}
          onOk={handleChangeGlossaryTerm}>
          <Transi18next
            i18nKey="message.entity-transfer-message"
            renderElement={<strong />}
            values={{
              from: movedGlossaryTerm?.from.name,
              to: movedGlossaryTerm?.to.name,
              entity: t('label.term-lowercase'),
            }}
          />
        </Modal>
      </Col>
    </Row>
  );
};

export default GlossaryTermTab;
