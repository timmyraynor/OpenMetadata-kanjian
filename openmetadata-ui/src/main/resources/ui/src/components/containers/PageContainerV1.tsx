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
  BankOutlined,
  FundViewOutlined,
  HomeOutlined,
  MonitorOutlined,
  SafetyOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { Layout, Menu } from 'antd';
import { Content } from 'antd/lib/layout/layout';
import Sider from 'antd/lib/layout/Sider';
import classNames from 'classnames';
import { ROUTES } from 'constants/constants';
import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';
import { activeLink } from 'utils/styleconstant';
import './PageContainerV1.css';

interface PageContainerV1Props {
  children: ReactNode;
  className?: string;
}

const PageContainerV1 = ({
  children,
  className = '',
}: PageContainerV1Props) => {
  const { t } = useTranslation();
  const location = useLocation();

  const navStyle = (value: boolean) => {
    if (value) {
      return { color: activeLink, textDecorationLine: 'none' };
    }

    return { textDecorationLine: 'none' };
  };

  const items = [
    {
      key: 'home',
      label: (
        <NavLink
          className="nav-side-bar"
          data-testid="appbar-item-data-home"
          style={navStyle(location.pathname.includes(ROUTES.MY_DATA))}
          to={{
            pathname: ROUTES.MY_DATA,
          }}>
          {t('label.home')}
        </NavLink>
      ),
      icon: <HomeOutlined />,
    },
    {
      key: 'quality',
      label: (
        <NavLink
          className="nav-side-bar"
          data-testid="appbar-item-data-quality"
          style={navStyle(location.pathname.includes(ROUTES.TEST_SUITES))}
          to={{
            pathname: ROUTES.TEST_SUITES,
          }}>
          {t('label.quality')}
        </NavLink>
      ),
      icon: <SafetyOutlined />,
    },
    {
      key: 'insight',
      label: (
        <NavLink
          className="nav-side-bar"
          data-testid="appbar-item-data-insight"
          style={navStyle(location.pathname.includes(ROUTES.DATA_INSIGHT))}
          to={{
            pathname: ROUTES.DATA_INSIGHT,
          }}>
          {t('label.insight-plural')}
        </NavLink>
      ),
      icon: <FundViewOutlined />,
    },
    {
      key: 'explore',
      label: (
        <NavLink
          className="nav-side-bar"
          data-testid="appbar-item-explore"
          style={navStyle(location.pathname.startsWith('/explore'))}
          to={{
            pathname: '/explore/tables',
          }}>
          {t('label.explore')}
        </NavLink>
      ),
      icon: <MonitorOutlined />,
    },
    {
      key: 'glossary',
      label: (
        <NavLink
          className="nav-side-bar"
          data-testid="appbar-item-glossary"
          style={navStyle(location.pathname.startsWith('/glossary'))}
          to={{
            pathname: ROUTES.GLOSSARY,
          }}>
          {t('label.glossary')}
        </NavLink>
      ),
      icon: <BankOutlined />,
    },
    {
      key: 'tags',
      label: (
        <NavLink
          className="nav-side-bar"
          data-testid="appbar-item-tags"
          style={navStyle(location.pathname.startsWith('/tags'))}
          to={{
            pathname: ROUTES.TAGS,
          }}>
          {t('label.classification')}
        </NavLink>
      ),
      icon: <TagsOutlined />,
    },
  ];

  const getSelectKeyFromPath = () => {
    if (location.pathname.includes(ROUTES.MY_DATA)) {
      return ['home'];
    } else if (location.pathname.includes(ROUTES.TEST_SUITES)) {
      return ['quality'];
    } else if (location.pathname.includes(ROUTES.DATA_INSIGHT)) {
      return ['insight'];
    } else if (location.pathname.startsWith('/explore')) {
      return ['explore'];
    } else if (location.pathname.startsWith('/glossary')) {
      return ['glossary'];
    } else if (location.pathname.startsWith('/tags')) {
      return ['tags'];
    } else {
      return [];
    }
  };

  return (
    <div
      className={classNames('page-container-v1 tw-bg-body-main', className)}
      data-testid="container"
      id="page-container-v1">
      <Layout>
        <Sider
          breakpoint="lg"
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
          }}
          theme="dark"
          width={150}>
          <Menu
            items={items}
            mode="inline"
            selectedKeys={getSelectKeyFromPath()}
            style={{ height: '100%' }}
          />
        </Sider>
        <Layout style={{ marginLeft: 150, padding: '0 16px 16px' }}>
          <Content style={{ margin: '16px 0', minHeight: 280 }}>
            {children}
          </Content>
        </Layout>
      </Layout>
    </div>
  );
};

export default PageContainerV1;
