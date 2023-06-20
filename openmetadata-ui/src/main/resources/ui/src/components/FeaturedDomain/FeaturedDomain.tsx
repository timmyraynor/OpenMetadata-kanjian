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

import { List, Skeleton } from 'antd';
import { EntityType } from 'enums/entity.enum';
import { GlossaryTerm } from 'generated/entity/data/glossaryTerm';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { getGlossariesByAttribute } from 'rest/glossaryAPI';
import { getEntityName } from 'utils/EntityUtils';
import { getEntityLink, getEntityTermIcon } from 'utils/TableUtils';
import './feature-domain.css';

const FeaturedDomain: FunctionComponent = () => {
  const [initLoading, setInitLoading] = useState(true);
  const [quickLinkItems, setQuickLinkItems] = useState<GlossaryTerm[]>([]);
  // const limit = 3;

  const prepareData = async () => {
    const quickLinkItemsResp = await getGlossariesByAttribute(
      'quickLink',
      'true',
      []
    );
    setQuickLinkItems(quickLinkItemsResp.data);
    setInitLoading(false);
  };

  useEffect(() => {
    prepareData();
  }, []);

  return (
    <div className="featured-view-panel">
      <List
        dataSource={quickLinkItems}
        itemLayout="horizontal"
        // loadMore={loadMore}
        loading={initLoading}
        renderItem={(item) => (
          <List.Item>
            <Skeleton active avatar loading={false} title={false}>
              <List.Item.Meta
                avatar={
                  <div
                    className="tw-flex tw-justify-end"
                    data-testid="service-icon">
                    {getEntityTermIcon(item, '32px')}
                  </div>
                }
                description={<div>{item.description}</div>}
                title={
                  <a
                    href={getEntityLink(
                      EntityType.GLOSSARY_TERM,
                      item.fullyQualifiedName as string
                    )}>
                    {getEntityName(item)}
                  </a>
                }
              />
            </Skeleton>
          </List.Item>
        )}
        size="small"
      />
    </div>
  );
};

export default FeaturedDomain;
