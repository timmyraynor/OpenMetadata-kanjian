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

import { Avatar, Card, Col, Row, Typography } from 'antd';
import EntityListSkeleton from 'components/Skeleton/MyData/EntityListSkeleton/EntityListSkeleton.component';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getEntityName } from 'utils/EntityUtils';
import {
  getEntityIcon,
  getEntityIconColor,
  getEntityLink,
} from 'utils/TableUtils';
import { EntityReference } from '../../generated/type/entityReference';
import { getRecentlyViewedData, prepareLabel } from '../../utils/CommonUtils';
import './recently-view-list.css';
const { Meta } = Card;

const RecentlyViewedList: FunctionComponent = () => {
  const { t } = useTranslation();
  const recentlyViewedData = getRecentlyViewedData();
  const [data, setData] = useState<Array<EntityReference>>([]);
  const [isLoading, setIsloading] = useState<boolean>(false);

  const prepareData = () => {
    if (recentlyViewedData.length) {
      setIsloading(true);
      const formattedData = recentlyViewedData
        .map((item) => {
          return {
            serviceType: item.serviceType,
            name: item.displayName || prepareLabel(item.entityType, item.fqn),
            fullyQualifiedName: item.fqn,
            type: item.entityType,
            tags: item.tags,
            description: item.description,
          };
        })
        .filter((item) => item.name);
      setData(formattedData as unknown as EntityReference[]);
      setIsloading(false);
    }
  };

  useEffect(() => {
    prepareData();
  }, []);

  return (
    <EntityListSkeleton
      dataLength={data.length !== 0 ? data.length : 5}
      loading={Boolean(isLoading)}>
      <>
        <div className="flex items-center" data-testid="recently-view-list">
          <Typography.Text className="font-medium text-primary m-x-xss">
            {t('label.recent-views')}
          </Typography.Text>
        </div>
        <Row className="filters-container" gutter={16} justify="space-between">
          {data.length
            ? data.map((item) => {
                return (
                  <Col key={item.id} span={6}>
                    <Card
                      bordered={false}
                      className="review-card-fix-height"
                      size="small">
                      <Meta
                        avatar={
                          item.type ? (
                            <Avatar
                              icon={getEntityIcon(item.type)}
                              style={{
                                backgroundColor: getEntityIconColor(item.type),
                              }}
                            />
                          ) : (
                            <Avatar />
                          )
                        }
                        description={item.description || 'N/A'}
                        title={
                          <Link
                            className="font-medium"
                            to={getEntityLink(
                              item.type || '',
                              item.fullyQualifiedName as string
                            )}>
                            {getEntityName(item as unknown as EntityReference)}
                          </Link>
                        }
                      />
                    </Card>
                  </Col>
                );
              })
            : t('message.no-recently-viewed-date')}
        </Row>
      </>
    </EntityListSkeleton>
  );
};

export default RecentlyViewedList;
