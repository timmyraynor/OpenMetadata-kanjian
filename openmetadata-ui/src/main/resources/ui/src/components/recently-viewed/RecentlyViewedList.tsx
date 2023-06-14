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

import { Button, List, Skeleton, Tag, Typography } from 'antd';
import TagsViewer from 'components/Tag/TagsViewer/tags-viewer';
import { TagLabel } from 'generated/type/tagLabel';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getEntityBaseName, getEntityName } from 'utils/EntityUtils';
import { getEntityIconFlex, getEntityLink } from 'utils/TableUtils';
import {
  getRecentlyViewedData,
  getServiceLogo,
  getTagValue,
  getTimeAgo,
} from '../../utils/CommonUtils';
import './recently-view-list.css';
const { Text } = Typography;

interface RecentlyViewListItem {
  serviceType: string;
  name: string;
  displayName: string;
  fullyQualifiedName: string;
  type: string;
  description: string;
  tags: Array<TagLabel>;
  timestamp: number;
}

const RecentlyViewedList: FunctionComponent = () => {
  const { t } = useTranslation();
  const recentlyViewedData = getRecentlyViewedData();
  const [data, setData] = useState<RecentlyViewListItem[]>([]);
  const [isLoading, setIsloading] = useState<boolean>(false);
  const [initLoading, setInitLoading] = useState(true);
  const [displayRecent, setDisplayRecent] = useState<RecentlyViewListItem[]>(
    []
  );
  const limit = 3;

  const prepareData = () => {
    if (recentlyViewedData.length) {
      setInitLoading(true);
      const formattedData = recentlyViewedData
        .map((item) => {
          return {
            serviceType: item.serviceType,
            name: item.name,
            displayName: item.displayName || item.name,
            fullyQualifiedName: item.fqn,
            type: item.entityType,
            tags: item.tags,
            description: item.description,
            timestamp: item.timestamp,
          };
        })
        .filter((item) => item.name);
      setData(formattedData as unknown as RecentlyViewListItem[]);
      setDisplayRecent(
        formattedData.slice(0, limit) as unknown as RecentlyViewListItem[]
        // formattedData as unknown as RecentlyViewListItem[]
      );
      setInitLoading(false);
    }
  };

  const onLoadMore = () => {
    setIsloading(true);
    setDisplayRecent(data);
    setIsloading(false);
  };

  const loadMore =
    !initLoading &&
    !isLoading &&
    displayRecent.length < recentlyViewedData.length ? (
      <div
        style={{
          textAlign: 'center',
          marginTop: 12,
          height: 32,
          lineHeight: '32px',
        }}>
        <Button onClick={onLoadMore}>{t('label.load-more')}</Button>
      </div>
    ) : null;

  useEffect(() => {
    prepareData();
  }, []);

  return (
    <div className="recent-view-panel">
      {/* <Typography.Title
        className="common-left-panel-card-heading m-b-sm"
        level={5}>
        {t('label.recent-views')}
      </Typography.Title> */}
      <List
        dataSource={displayRecent}
        itemLayout="vertical"
        loadMore={loadMore}
        loading={initLoading}
        renderItem={(item) => (
          <List.Item extra={<div>{getTimeAgo(item.timestamp)}</div>}>
            <Skeleton active avatar loading={false} title={false}>
              <List.Item.Meta
                avatar={
                  <div
                    className="tw-flex tw-justify-end"
                    data-testid="service-icon">
                    {getServiceLogo(item.serviceType || '', 'h-7')}
                  </div>
                }
                description={
                  <div>
                    <Tag color="default" icon={getEntityIconFlex(item.type)}>
                      {getEntityBaseName(item)}
                    </Tag>
                    {item.tags && item.tags.length > 0 ? (
                      <TagsViewer
                        sizeCap={-1}
                        tags={(item.tags || []).map((tag) => getTagValue(tag))}
                      />
                    ) : null}
                  </div>
                }
                title={
                  <a
                    href={getEntityLink(
                      item.type || '',
                      item.fullyQualifiedName as string
                    )}>
                    {getEntityName(item)}
                  </a>
                }
              />
              <div>
                <Text className="line-clamp">{item.description}</Text>
              </div>
            </Skeleton>
          </List.Item>
        )}
        size="small"
      />
    </div>
  );
};

export default RecentlyViewedList;
