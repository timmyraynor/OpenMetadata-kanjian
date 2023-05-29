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

import { Col, Row } from 'antd';
import classNames from 'classnames';
import TitleBreadcrumb from 'components/common/title-breadcrumb/title-breadcrumb.component';
import { TitleBreadcrumbProps } from 'components/common/title-breadcrumb/title-breadcrumb.interface';
import { EntityType } from 'enums/entity.enum';
import { TagLabel } from 'generated/entity/data/table';
import React, { ReactNode } from 'react';
import {
  getEntityBaseName,
  getEntityBusinessName,
  getEntityLinkFromType,
} from 'utils/EntityUtils';
import { getEncodedFqn } from 'utils/StringsUtils';
import EntityHeaderTitle from '../EntityHeaderTitle/EntityHeaderTitle.component';

interface Props {
  extra?: ReactNode;
  breadcrumb: TitleBreadcrumbProps['titleLinks'];
  entityData: {
    displayName?: string;
    name: string;
    fullyQualifiedName?: string;
    deleted?: boolean;
    tags?: string[] | TagLabel[];
  };
  entityType?: EntityType;
  icon: ReactNode;
  titleIsLink?: boolean;
  openEntityInNewPage?: boolean;
  gutter?: 'default' | 'large';
  serviceName: string;
  canUpdateDisplayName?: boolean;
  updateDisplayName?: (canUpdate: string) => void;
  onCancel?: () => void;
  isEdit?: boolean;
  editDisplayName?: () => void;
}

export const EntityHeader = ({
  breadcrumb,
  entityData,
  extra,
  icon,
  titleIsLink = false,
  entityType,
  updateDisplayName,
  canUpdateDisplayName,
  openEntityInNewPage,
  gutter = 'default',
  serviceName,
  onCancel,
  isEdit,
  editDisplayName,
}: Props) => {
  return (
    <Row
      className="w-full font-medium"
      gutter={0}
      justify="space-between"
      wrap={false}>
      <Col>
        <div
          className={classNames(
            'tw-text-link tw-text-base glossary-breadcrumb',
            gutter === 'large' ? 'm-b-sm' : 'm-b-xss'
          )}
          data-testid="category-name">
          <TitleBreadcrumb titleLinks={breadcrumb} />
        </div>

        <EntityHeaderTitle
          canUpdateDisplayName={canUpdateDisplayName || false}
          deleted={entityData.deleted}
          displayName={getEntityBusinessName(entityData)}
          editDisplayName={editDisplayName}
          entityData={entityData}
          icon={icon}
          isEdit={isEdit}
          link={
            titleIsLink && entityData.fullyQualifiedName && entityType
              ? getEntityLinkFromType(
                  getEncodedFqn(entityData.fullyQualifiedName),
                  entityType
                )
              : undefined
          }
          name={getEntityBaseName(entityData)}
          openEntityInNewPage={openEntityInNewPage}
          serviceName={serviceName}
          updateDisplayName={updateDisplayName}
          onCancel={onCancel}
        />
      </Col>
      <Col>{extra}</Col>
    </Row>
  );
};
