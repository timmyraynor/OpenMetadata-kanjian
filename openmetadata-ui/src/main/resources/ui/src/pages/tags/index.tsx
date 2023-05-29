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

import {
  Button,
  Col,
  Dropdown,
  Row,
  Space,
  Spin,
  Table,
  Tooltip,
  Typography,
} from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { ReactComponent as LockIcon } from 'assets/svg/closed-lock.svg';
import { ReactComponent as EditIcon } from 'assets/svg/edit-new.svg';
import { ReactComponent as IconDropdown } from 'assets/svg/menu.svg';
import { ReactComponent as IconTag } from 'assets/svg/tag-grey.svg';
import { AxiosError } from 'axios';
import AppBadge from 'components/common/Badge/Badge.component';
import Description from 'components/common/description/Description';
import ErrorPlaceHolder from 'components/common/error-with-placeholder/ErrorPlaceHolder';
import LeftPanelCard from 'components/common/LeftPanelCard/LeftPanelCard';
import NextPrevious from 'components/common/next-previous/NextPrevious';
import RichTextEditorPreviewer from 'components/common/rich-text-editor/RichTextEditorPreviewer';
import PageContainerV1 from 'components/containers/PageContainerV1';
import PageLayoutV1 from 'components/containers/PageLayoutV1';
import EntityHeaderTitle from 'components/Entity/EntityHeaderTitle/EntityHeaderTitle.component';
import Loader from 'components/Loader/Loader';
import EntityDeleteModal from 'components/Modals/EntityDeleteModal/EntityDeleteModal';
import EntityNameModal from 'components/Modals/EntityNameModal/EntityNameModal.component';
import { usePermissionProvider } from 'components/PermissionProvider/PermissionProvider';
import {
  OperationPermission,
  ResourceEntity,
} from 'components/PermissionProvider/PermissionProvider.interface';
import TagsLeftPanelSkeleton from 'components/Skeleton/Tags/TagsLeftPanelSkeleton.component';
import { LOADING_STATE } from 'enums/common.enum';
import { compare } from 'fast-json-patch';
import { capitalize, isUndefined, trim } from 'lodash';
import { FormErrorData } from 'Models';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useHistory, useParams } from 'react-router-dom';
import {
  createClassification,
  createTag,
  deleteClassification,
  deleteTag,
  getAllClassifications,
  getClassificationByName,
  getTags,
  patchClassification,
  patchTag,
} from 'rest/tagAPI';
import { getEntityBaseName, getEntityName } from 'utils/EntityUtils';
import { ReactComponent as PlusIcon } from '../../assets/svg/plus-primary.svg';
import {
  DE_ACTIVE_COLOR,
  getExplorePath,
  INITIAL_PAGING_VALUE,
  NO_DATA_PLACEHOLDER,
  PAGE_SIZE,
  TIER_CATEGORY,
} from '../../constants/constants';
import { CreateClassification } from '../../generated/api/classification/createClassification';
import { ProviderType } from '../../generated/entity/bot';
import { Classification } from '../../generated/entity/classification/classification';
import { Tag } from '../../generated/entity/classification/tag';
import { Operation } from '../../generated/entity/policies/accessControl/rule';
import { EntityReference } from '../../generated/type/entityReference';
import { Paging } from '../../generated/type/paging';
import {
  getActiveCatClass,
  getCountBadge,
  getEntityDeleteMessage,
} from '../../utils/CommonUtils';
import {
  checkPermission,
  DEFAULT_ENTITY_PERMISSION,
} from '../../utils/PermissionsUtils';
import { getTagPath } from '../../utils/RouterUtils';
import { getErrorText } from '../../utils/StringsUtils';
import { showErrorToast } from '../../utils/ToastUtils';
import './TagPage.style.less';
import TagsForm from './TagsForm';
import { DeleteTagsType } from './TagsPage.interface';
import { getDeleteIcon } from './TagsPageUtils';

const TagsPage = () => {
  const { getEntityPermission, permissions } = usePermissionProvider();
  const history = useHistory();
  const { tagCategoryName } = useParams<Record<string, string>>();
  const [classifications, setClassifications] = useState<Array<Classification>>(
    []
  );
  const [currentClassification, setCurrentClassification] =
    useState<Classification>();
  const [isEditClassification, setIsEditClassification] =
    useState<boolean>(false);
  const [isAddingClassification, setIsAddingClassification] =
    useState<boolean>(false);
  const [isTagModal, setIsTagModal] = useState<boolean>(false);
  const [editTag, setEditTag] = useState<Tag>();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  useState<FormErrorData>();
  const [deleteTags, setDeleteTags] = useState<DeleteTagsType>({
    data: undefined,
    state: false,
  });
  const [classificationPermissions, setClassificationPermissions] =
    useState<OperationPermission>(DEFAULT_ENTITY_PERMISSION);
  const [isNameEditing, setIsNameEditing] = useState<boolean>(false);
  const [currentClassificationName, setCurrentClassificationName] =
    useState<string>('');
  const [tags, setTags] = useState<Tag[]>();
  const [paging, setPaging] = useState<Paging>({} as Paging);
  const [currentPage, setCurrentPage] = useState<number>(INITIAL_PAGING_VALUE);
  const [isTagsLoading, setIsTagsLoading] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState<boolean>(false);
  const [showActions, setShowActions] = useState(false);

  const { t } = useTranslation();
  const createClassificationPermission = useMemo(
    () =>
      checkPermission(
        Operation.Create,
        ResourceEntity.CLASSIFICATION,
        permissions
      ),
    [permissions]
  );
  const [deleteStatus, setDeleteStatus] = useState<LOADING_STATE>(
    LOADING_STATE.INITIAL
  );

  const createTagPermission = useMemo(
    () => checkPermission(Operation.Create, ResourceEntity.TAG, permissions),
    [permissions]
  );

  const manageButtonContent = [
    {
      label: (
        <Row
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setIsNameEditing(true);
            setShowActions(false);
          }}>
          <Col className="self-center" span={3}>
            <EditIcon color={DE_ACTIVE_COLOR} width="18px" />
          </Col>
          <Col className="tw-text-left" data-testid="edit-button" span={21}>
            <p className="font-medium" data-testid="edit-button-title">
              {t('label.rename')}
            </p>
            <p className="text-grey-muted text-xs">
              {t('message.rename-entity', {
                entity: t('label.classification'),
              })}
            </p>
          </Col>
        </Row>
      ),
      key: 'rename-button',
    },
  ];

  const fetchCurrentClassificationPermission = async () => {
    try {
      const response = await getEntityPermission(
        ResourceEntity.CLASSIFICATION,
        currentClassification?.id as string
      );
      setClassificationPermissions(response);
    } catch (error) {
      showErrorToast(error as AxiosError);
    }
  };

  const fetchClassificationChildren = async (
    currentClassificationName: string,
    paging?: Paging
  ) => {
    setIsTagsLoading(true);

    try {
      const tagsResponse = await getTags({
        arrQueryFields: 'usageCount',
        parent: currentClassificationName,
        after: paging && paging.after,
        before: paging && paging.before,
        limit: PAGE_SIZE,
      });
      setTags(tagsResponse.data);
      setPaging(tagsResponse.paging);
    } catch (error) {
      const errMsg = getErrorText(
        error as AxiosError,
        t('server.entity-fetch-error', { entity: t('label.tag-plural') })
      );
      showErrorToast(errMsg);
      setError(errMsg);
      setTags([]);
    } finally {
      setIsTagsLoading(false);
    }
  };

  const fetchClassifications = async (setCurrent?: boolean) => {
    setIsLoading(true);

    try {
      const response = await getAllClassifications('termCount', 1000);
      setClassifications(response.data);
      if (setCurrent && response.data.length) {
        setCurrentClassification(response.data[0]);
        setCurrentClassificationName(response.data[0].name);

        history.push(getTagPath(response.data[0].name));
      }
    } catch (error) {
      const errMsg = getErrorText(
        error as AxiosError,
        t('server.entity-fetch-error', {
          entity: t('label.tag-category-lowercase'),
        })
      );
      showErrorToast(errMsg);
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentClassification = async (name: string, update?: boolean) => {
    if (currentClassification?.name !== name || update) {
      setIsLoading(true);
      try {
        const currentClassification = await getClassificationByName(name, [
          'usageCount',
          'termCount',
        ]);
        if (currentClassification) {
          setClassifications((prevClassifications) =>
            prevClassifications.map((data) => {
              if (data.name === name) {
                return {
                  ...data,
                  termCount: currentClassification.termCount,
                };
              }

              return data;
            })
          );
          setCurrentClassification(currentClassification);
          setCurrentClassificationName(currentClassification.name);
          setIsLoading(false);
        } else {
          showErrorToast(t('server.unexpected-response'));
        }
      } catch (err) {
        const errMsg = getErrorText(
          err as AxiosError,
          t('server.entity-fetch-error', {
            entity: t('label.tag-category-lowercase'),
          })
        );
        showErrorToast(errMsg);
        setError(errMsg);
        setCurrentClassification({ name } as Classification);
        setIsLoading(false);
      }
    }
  };

  const createCategory = async (data: CreateClassification) => {
    setIsButtonLoading(true);
    try {
      const res = await createClassification({
        ...data,
        name: trim(data.name),
      });
      await fetchClassifications();
      history.push(getTagPath(res.name));
    } catch (error) {
      showErrorToast(
        error as AxiosError,
        t('server.create-entity-error', {
          entity: t('label.tag-category-lowercase'),
        })
      );
    } finally {
      setIsAddingClassification(false);
      setIsButtonLoading(false);
    }
  };

  const onCancel = () => {
    setEditTag(undefined);
    setIsTagModal(false);
    setIsAddingClassification(false);
  };

  /**
   * It will set current tag category for delete
   */
  const deleteTagHandler = () => {
    if (currentClassification) {
      setDeleteTags({
        data: {
          id: currentClassification.id as string,
          name: currentClassification.displayName || currentClassification.name,
          isCategory: true,
        },
        state: true,
      });
    }
  };

  /**
   * Take tag category id and delete.
   * @param classificationId - tag category id
   */
  const deleteClassificationById = async (classificationId: string) => {
    setIsLoading(true);
    try {
      await deleteClassification(classificationId);
      setDeleteStatus(LOADING_STATE.SUCCESS);

      const renamingClassification = [...classifications].filter(
        (data) => data.id !== classificationId
      );
      const currentClassification = renamingClassification[0];
      setClassifications(renamingClassification);
      history.push(
        getTagPath(
          currentClassification?.fullyQualifiedName ||
            currentClassification?.name
        )
      );
    } catch (error) {
      showErrorToast(
        error as AxiosError,
        t('server.delete-entity-error', {
          entity: t('label.tag-category-lowercase'),
        })
      );
    } finally {
      setDeleteTags({ data: undefined, state: false });
      setIsLoading(false);
      setDeleteStatus(LOADING_STATE.INITIAL);
    }
  };

  /**
   * Takes category name and tag id and delete the tag
   * @param categoryName - tag category name
   * @param tagId -  tag id
   */
  const handleDeleteTag = (tagId: string) => {
    deleteTag(tagId)
      .then((res) => {
        if (res) {
          if (currentClassification) {
            setDeleteStatus(LOADING_STATE.SUCCESS);
            setCurrentClassification({
              ...currentClassification,
            });
          }
        } else {
          showErrorToast(
            t('server.delete-entity-error', {
              entity: t('label.tag-lowercase'),
            })
          );
        }
      })
      .catch((err: AxiosError) => {
        showErrorToast(
          err,
          t('server.delete-entity-error', { entity: t('label.tag-lowercase') })
        );
      })
      .finally(() => {
        setDeleteTags({ data: undefined, state: false });
        setDeleteStatus(LOADING_STATE.INITIAL);
      });
  };

  /**
   * It redirects to respective function call based on tag/Classification
   */
  const handleConfirmClick = () => {
    setDeleteStatus(LOADING_STATE.WAITING);
    if (deleteTags.data?.isCategory) {
      deleteClassificationById(deleteTags.data.id as string);
    } else {
      handleDeleteTag(deleteTags.data?.id as string);
    }
  };

  const handleUpdateCategory = async (
    updatedClassification: Classification
  ) => {
    if (!isUndefined(currentClassification)) {
      const patchData = compare(currentClassification, updatedClassification);
      try {
        const response = await patchClassification(
          currentClassification?.id || '',
          patchData
        );
        if (response) {
          fetchClassifications();
          if (currentClassification?.name !== updatedClassification.name) {
            history.push(getTagPath(response.name));
            setIsNameEditing(false);
          } else {
            await fetchCurrentClassification(currentClassification?.name, true);
          }
        } else {
          throw t('server.unexpected-response');
        }
      } catch (error) {
        showErrorToast(error as AxiosError);
      } finally {
        setIsEditClassification(false);
      }
    }
  };

  const handleRenameSave = (data: { name: string; displayName: string }) => {
    if (!isUndefined(currentClassification)) {
      handleUpdateCategory({
        ...currentClassification,
        ...data,
      });
      setIsNameEditing(false);
    }
  };

  const handleUpdateDescription = async (updatedHTML: string) => {
    if (!isUndefined(currentClassification)) {
      handleUpdateCategory({
        ...currentClassification,
        description: updatedHTML,
      });
    }
  };

  const createPrimaryTag = async (data: Classification) => {
    try {
      await createTag({
        ...data,
        classification: currentClassification?.name ?? '',
      });

      fetchCurrentClassification(currentClassification?.name as string, true);
    } catch (error) {
      showErrorToast(
        error as AxiosError,
        t('label.create-entity-error', {
          entity: t('label.tag-lowercase'),
        })
      );
    } finally {
      setIsTagModal(false);
    }
  };

  const updatePrimaryTag = async (updatedData: Tag) => {
    if (!isUndefined(editTag)) {
      setIsButtonLoading(true);
      const patchData = compare(editTag, updatedData);
      try {
        const response = await patchTag(editTag.id || '', patchData);
        if (response) {
          fetchCurrentClassification(
            currentClassification?.name as string,
            true
          );
        } else {
          throw t('server.unexpected-response');
        }
      } catch (error) {
        showErrorToast(error as AxiosError);
      } finally {
        setIsButtonLoading(false);
        onCancel();
      }
    }
  };

  const getUsageCountLink = (tagFQN: string) => {
    const type = tagFQN.startsWith('Tier') ? 'tier' : 'tags';

    return getExplorePath({
      extraParameters: {
        facetFilter: {
          [`${type}.tagFQN`]: [tagFQN],
        },
      },
    });
  };

  const handleActionDeleteTag = (record: Tag) => {
    if (currentClassification) {
      setDeleteTags({
        data: {
          id: record.id as string,
          name: record.name,
          categoryName: currentClassification?.name,
          isCategory: false,
          status: 'waiting',
        },
        state: true,
      });
    }
  };

  useEffect(() => {
    if (currentClassification) {
      fetchCurrentClassificationPermission();
    }
  }, [currentClassification]);

  useEffect(() => {
    /**
     * If ClassificationName is present then fetch that category
     */
    if (tagCategoryName) {
      const isTier = tagCategoryName.startsWith(TIER_CATEGORY);
      fetchCurrentClassification(isTier ? TIER_CATEGORY : tagCategoryName);
    }
  }, [tagCategoryName]);

  useEffect(() => {
    /**
     * Fetch all classifications initially
     * Do not set current if we already have currentClassification set
     */
    fetchClassifications(!tagCategoryName);
  }, []);

  useEffect(() => {
    currentClassification &&
      fetchClassificationChildren(currentClassification?.name);
  }, [currentClassification]);

  const onClickClassifications = (category: Classification) => {
    setCurrentClassification(category);
    setCurrentClassificationName(category.name);
    history.push(getTagPath(category.name));
  };

  const handlePageChange = useCallback(
    (cursorType: string | number, activePage?: number) => {
      if (cursorType) {
        const pagination = {
          [cursorType]: paging[cursorType as keyof Paging] as string,
          total: paging.total,
        } as Paging;

        setCurrentPage(activePage ?? INITIAL_PAGING_VALUE);
        fetchClassificationChildren(currentClassificationName, pagination);
      }
    },
    [fetchClassificationChildren, paging, currentClassificationName]
  );

  // Use the component in the render method

  const fetchLeftPanel = () => {
    return (
      <LeftPanelCard id="tags">
        <TagsLeftPanelSkeleton loading={isLoading}>
          <div className="tw-py-2" data-testid="data-summary-container">
            <div className="tw-px-3">
              <h6 className="tw-heading tw-text-sm tw-font-semibold">
                {t('label.classification-plural')}
              </h6>
              <div className="tw-mb-3">
                <Tooltip
                  title={
                    !createClassificationPermission &&
                    t('message.no-permission-for-action')
                  }>
                  <Button
                    block
                    className=" text-primary"
                    data-testid="add-classification"
                    disabled={!createClassificationPermission}
                    icon={<PlusIcon className="anticon" />}
                    onClick={() => {
                      setIsAddingClassification((prevState) => !prevState);
                    }}>
                    <span>
                      {t('label.add-entity', {
                        entity: t('label.classification'),
                      })}
                    </span>
                  </Button>
                </Tooltip>
              </div>
            </div>

            {classifications &&
              classifications.map((category: Classification) => (
                <div
                  className={`tw-group align-center content-box cursor-pointer tw-text-grey-body tw-text-body tw-flex p-y-xss p-x-sm m-y-xss ${getActiveCatClass(
                    category.name,
                    currentClassification?.name
                  )}`}
                  data-testid="side-panel-classification"
                  key={category.name}
                  onClick={() => onClickClassifications(category)}>
                  <Typography.Paragraph
                    className="ant-typography-ellipsis-custom tag-category label-category self-center"
                    data-testid="tag-name"
                    ellipsis={{ rows: 1, tooltip: true }}>
                    {getEntityName(category as unknown as EntityReference)}
                  </Typography.Paragraph>

                  {getCountBadge(
                    category.termCount,
                    'self-center m-l-auto',
                    currentClassification?.name === category.name
                  )}
                </div>
              ))}
          </div>
        </TagsLeftPanelSkeleton>
      </LeftPanelCard>
    );
  };

  const tableColumn = useMemo(
    () =>
      [
        {
          title: t('label.tag'),
          dataIndex: 'name',
          key: 'name',
          width: 200,
        },
        {
          title: t('label.display-name'),
          dataIndex: 'displayName',
          key: 'displayName',
          width: 200,
          render: (text) => (
            <Typography.Text>{text || NO_DATA_PLACEHOLDER}</Typography.Text>
          ),
        },
        {
          title: t('label.description'),
          dataIndex: 'description',
          key: 'description',
          render: (text: string, record: Tag) => (
            <div className="tw-group tableBody-cell">
              <div className="cursor-pointer d-flex">
                <div>
                  {text ? (
                    <RichTextEditorPreviewer markdown={text} />
                  ) : (
                    <span className="tw-no-description">
                      {t('label.no-entity', {
                        entity: t('label.description'),
                      })}
                    </span>
                  )}
                </div>
              </div>
              <div className="tw-mt-1" data-testid="usage">
                <span className="tw-text-grey-muted tw-mr-1">
                  {`${t('label.usage')}:`}
                </span>
                {record.usageCount ? (
                  <Link
                    className="link-text tw-align-middle"
                    data-testid="usage-count"
                    to={getUsageCountLink(record.fullyQualifiedName || '')}>
                    {record.usageCount}
                  </Link>
                ) : (
                  <span className="tw-no-description">
                    {t('label.not-used')}
                  </span>
                )}
              </div>
            </div>
          ),
        },
        {
          title: t('label.action-plural'),
          dataIndex: 'actions',
          key: 'actions',
          width: 120,
          align: 'center',
          render: (_, record: Tag) => (
            <Space align="center" size={8}>
              <Button
                className="p-0 flex-center"
                data-testid="edit-button"
                disabled={
                  !(
                    classificationPermissions.EditDescription ||
                    classificationPermissions.EditAll
                  )
                }
                icon={
                  <EditIcon
                    data-testid="editTagDescription"
                    height={16}
                    name="edit"
                    width={16}
                  />
                }
                size="small"
                type="text"
                onClick={() => {
                  setIsTagModal(true);
                  setEditTag(record);
                }}
              />

              <Tooltip
                placement="topRight"
                title={
                  (record.provider === ProviderType.System ||
                    !classificationPermissions.EditAll) &&
                  t('message.no-permission-for-action')
                }>
                <Button
                  className="p-0 flex-center"
                  data-testid="delete-tag"
                  disabled={
                    record.provider === ProviderType.System ||
                    !classificationPermissions.EditAll
                  }
                  icon={getDeleteIcon(deleteTags, record.id)}
                  size="small"
                  type="text"
                  onClick={() => handleActionDeleteTag(record)}
                />
              </Tooltip>
            </Space>
          ),
        },
      ] as ColumnsType<Tag>,
    [
      currentClassification,
      classificationPermissions,
      deleteTags,
      tags,
      deleteTags,
    ]
  );

  return (
    <PageContainerV1>
      <PageLayoutV1
        leftPanel={fetchLeftPanel()}
        pageTitle={t('label.tag-plural')}>
        {isLoading ? (
          <Loader />
        ) : error ? (
          <ErrorPlaceHolder>
            <p className="tw-text-center tw-m-auto">{error}</p>
          </ErrorPlaceHolder>
        ) : (
          <div className="full-height" data-testid="tags-container">
            {currentClassification && (
              <Space
                align="start"
                className="w-full justify-between"
                data-testid="header">
                <Space align="end">
                  <EntityHeaderTitle
                    displayName={getEntityName(currentClassification)}
                    entityData={{
                      name: getEntityBaseName(currentClassification),
                    }}
                    icon={
                      <IconTag
                        className="h-9"
                        style={{ color: DE_ACTIVE_COLOR }}
                      />
                    }
                    name={currentClassification.name}
                    serviceName="classification"
                  />
                  {currentClassification.provider === ProviderType.System && (
                    <AppBadge
                      className="m--t-xss"
                      icon={<LockIcon height={12} />}
                      label={capitalize(currentClassification.provider)}
                    />
                  )}
                </Space>
                <div className="flex-center">
                  <Tooltip
                    title={
                      !(
                        createTagPermission || classificationPermissions.EditAll
                      ) && t('message.no-permission-for-action')
                    }>
                    <Button
                      className="add-new-tag-btn"
                      data-testid="add-new-tag-button"
                      disabled={
                        !(
                          createTagPermission ||
                          classificationPermissions.EditAll
                        )
                      }
                      size="small"
                      type="primary"
                      onClick={() => {
                        setIsTagModal((prevState) => !prevState);
                      }}>
                      {t('label.add-entity', {
                        entity: t('label.tag'),
                      })}
                    </Button>
                  </Tooltip>
                  <Tooltip
                    title={
                      (currentClassification.provider === ProviderType.System ||
                        !classificationPermissions.Delete) &&
                      t('message.no-permission-for-action')
                    }>
                    <Button
                      className="add-new-tag-btn tw-ml-2"
                      data-testid="delete-classification-or-tag"
                      disabled={
                        currentClassification.provider ===
                          ProviderType.System ||
                        !classificationPermissions.Delete
                      }
                      size="small"
                      onClick={() => deleteTagHandler()}>
                      {t('label.delete-entity', {
                        entity: t('label.classification'),
                      })}
                    </Button>
                  </Tooltip>
                  {currentClassification.provider !== ProviderType.System &&
                    (classificationPermissions.EditAll ||
                      classificationPermissions.EditDisplayName) && (
                      <Dropdown
                        align={{ targetOffset: [-12, 0] }}
                        className="m-l-xs"
                        menu={{
                          items: manageButtonContent,
                        }}
                        open={showActions}
                        overlayStyle={{ width: '350px' }}
                        placement="bottomRight"
                        trigger={['click']}
                        onOpenChange={setShowActions}>
                        <Tooltip placement="right">
                          <Button
                            className="glossary-manage-dropdown-button tw-px-1.5"
                            data-testid="manage-button"
                            onClick={() => setShowActions(true)}>
                            <IconDropdown className="anticon self-center manage-dropdown-icon" />
                          </Button>
                        </Tooltip>
                      </Dropdown>
                    )}
                </div>
              </Space>
            )}
            <div className="m-b-sm m-t-xs" data-testid="description-container">
              <Description
                description={currentClassification?.description || ''}
                entityName={
                  currentClassification?.displayName ??
                  currentClassification?.name
                }
                hasEditAccess={
                  classificationPermissions.EditDescription ||
                  classificationPermissions.EditAll
                }
                isEdit={isEditClassification}
                onCancel={() => setIsEditClassification(false)}
                onDescriptionEdit={() => setIsEditClassification(true)}
                onDescriptionUpdate={handleUpdateDescription}
              />
            </div>
            <Table
              bordered
              columns={tableColumn}
              data-testid="table"
              dataSource={tags}
              loading={{
                indicator: (
                  <Spin indicator={<Loader size="small" />} size="small" />
                ),
                spinning: isTagsLoading,
              }}
              pagination={false}
              rowKey="id"
              size="small"
            />
            {paging.total > PAGE_SIZE && (
              <NextPrevious
                currentPage={currentPage}
                pageSize={PAGE_SIZE}
                paging={paging}
                pagingHandler={handlePageChange}
                totalCount={paging.total}
              />
            )}

            {/* Classification Form */}
            <TagsForm
              isClassification
              showMutuallyExclusive
              data={classifications}
              header={t('label.adding-new-classification')}
              isLoading={isButtonLoading}
              visible={isAddingClassification}
              onCancel={onCancel}
              onSubmit={(data) => createCategory(data as Classification)}
            />

            {/* Tags Form */}
            <TagsForm
              header={
                editTag
                  ? t('label.edit-entity', {
                      entity: t('label.tag'),
                    })
                  : t('message.adding-new-tag', {
                      categoryName:
                        currentClassification?.displayName ??
                        currentClassification?.name,
                    })
              }
              initialValues={editTag}
              isLoading={isButtonLoading}
              isSystemTag={editTag?.provider === ProviderType.System}
              visible={isTagModal}
              onCancel={onCancel}
              onSubmit={(data) => {
                if (editTag) {
                  updatePrimaryTag({ ...editTag, ...data } as Tag);
                } else {
                  createPrimaryTag(data as Classification);
                }
              }}
            />
            <EntityDeleteModal
              bodyText={getEntityDeleteMessage(deleteTags.data?.name ?? '', '')}
              entityName={deleteTags.data?.name ?? ''}
              entityType={t('label.classification')}
              loadingState={deleteStatus}
              visible={deleteTags.state}
              onCancel={() => setDeleteTags({ data: undefined, state: false })}
              onConfirm={handleConfirmClick}
            />
            {currentClassification && (
              <EntityNameModal
                entity={currentClassification as EntityReference}
                visible={isNameEditing}
                onCancel={() => setIsNameEditing(false)}
                onSave={handleRenameSave}
              />
            )}
          </div>
        )}
      </PageLayoutV1>
    </PageContainerV1>
  );
};

export default TagsPage;
