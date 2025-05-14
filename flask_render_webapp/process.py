# process.py

from flask import Blueprint, request, jsonify, send_file
from collections import OrderedDict
import pandas as pd
import numpy as np
import os
import json
import glob


process_blueprint = Blueprint('process', __name__)

# Global Variables
DF = None
DF_A = None
DF_B = None
FILTER = None
PL = None
OL = None
DF_DO = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
DOWNLOAD_FOLDER = os.path.join(BASE_DIR, 'downloads')
EXPORT_FOLDER = os.path.join(BASE_DIR, 'exports')


def set_filter(df):
    global FILTER, DF, DF_A, DF_B, PL, OL
    DF = df.copy()
    DF_A = DF.copy()
    DF_B = DF_A.copy()
    FILTER = DF_B.copy()
    PL = df.copy()
    OL = df.copy()


def ensure_folder_exists(path):
    if not os.path.exists(path):
        os.makedirs(path)


'''''''''''''''
Data Processing
'''''''''''''''

def process_step_a(df, DF_MASTER, SHIPPER, SIZE):
    global DF_A, DF
    DF = df.copy()
    DF_A = df.copy()

    if DF_MASTER is None or DF_MASTER.empty:
        print('DF_MASTER is None or Empty!')  # Debug
    else:
        print(f'DF_MASTER Loaded - Columns: {DF_MASTER.columns.tolist()}')  # Debug

    # Basic cleaning
    DF_A = DF_A.replace([float('inf'), float('-inf')], float('nan')).fillna('')
    # DF_A['Province (State)'].isnull() | (DF_A['Province (State)'] == '')
    DF_A.loc[DF_A['Province (State)'].isnull() | (DF_A['Province (State)'] == ''), 'Province (State)'] = DF_A['Country']

    # Renaming columns
    if 'Delivery Address' not in DF_A.columns:
        DF_A.rename(columns={'Shipping Address': 'Delivery Address'}, inplace=True)

    # Convert data types
    DF_A['Quantity'] = pd.to_numeric(DF_A['Quantity'], errors='coerce').fillna(0).astype(int)
    DF_A['Order Time'] = pd.to_datetime(DF_A['Order Time'], dayfirst=True)
    DF_A['Phone Number'] = DF_A['Phone Number'].astype(str)
    DF_A['Post Code'] = DF_A['Post Code'].astype(str)
    DF_A['Tracking Number'] = DF_A['Tracking Number'].astype(str)
    DF_A['SKU'] = DF_A['SKU'].str.lower().astype(str).str.strip()
    DF_MASTER['SKU PICKLIST'] = DF_MASTER['SKU PICKLIST'].astype(str).str.lower().str.strip()

    # Mapping specific columns
    DF_A['Product Name'] = DF_A['SKU'].map(DF_MASTER.set_index('SKU PICKLIST')['PRODUCT SHORT NAME'])
    DF_A['Barcode'] = DF_A['SKU'].map(DF_MASTER.set_index('SKU PICKLIST')['BARCODE'])
    DF_A['SKU'] = DF_A['SKU'].map(DF_MASTER.set_index('SKU PICKLIST')['PRODUCT SKU'])

    # Add columns
    DF_A['Design'] = DF_A['SKU'].map(DF_MASTER.set_index('PRODUCT SKU')['NICK NAME'])
    DF_A['Design Color Size'] = DF_A['SKU'].map(DF_MASTER.set_index('PRODUCT SKU')['NAME, COLOR, SIZE'])
    DF_A['Design Color'] = DF_A['SKU'].map(DF_MASTER.set_index('PRODUCT SKU')['NAME, COLOR'])
    DF_A['Design Size'] = DF_A['SKU'].map(DF_MASTER.set_index('PRODUCT SKU')['NAME, SIZE'])
    DF_A['Product Location'] = DF_A['SKU'].map(DF_MASTER.set_index('PRODUCT SKU')['LOCATION'])

    # Mapping specific columns with condition
    state = 'Province (State)'
    shipper_field = 'Buyer Designed Logistics'
    shopify = DF_A['Marketplace'] == 'Shopify'
    non_shopify = DF_A['Marketplace'] != 'Shopify'

    courier_map = SHIPPER.set_index('STATE')['COURIER']
    shipper_map = SHIPPER.set_index('STATE')['SHIPPER']
    store_map = SHIPPER.set_index('STATE')['STORE']
    shipper_seq_map = SHIPPER.set_index('STATE')['SEQ']
    shipper_size_map = SIZE.set_index('SIZE')['SEQ']

    # shipper mapping
    DF_A.loc[shopify, 'Shipper'] = DF_A.loc[shopify, state].map(shipper_map)
    DF_A.loc[non_shopify, 'Shipper'] = DF_A.loc[non_shopify, shipper_field].map(shipper_map)
    # courier mapping
    DF_A.loc[shopify, 'Courier'] = DF_A.loc[shopify, state].map(courier_map)
    DF_A.loc[non_shopify, 'Courier'] = DF_A.loc[non_shopify, shipper_field].map(courier_map)
    # store mapping
    DF_A.loc[shopify, 'Store'] = DF_A.loc[shopify, state].map(store_map)
    DF_A.loc[non_shopify, 'Store'] = DF_A.loc[non_shopify, shipper_field].map(store_map)
    # courier sequence mapping
    DF_A.loc[shopify, 'SEQ'] = DF_A.loc[shopify, state].map(shipper_seq_map)
    DF_A.loc[non_shopify, 'SEQ'] = DF_A.loc[non_shopify, shipper_field].map(shipper_seq_map)
    # size mapping
    DF_A['Size Sequence'] = DF_A['SKU'].str.extract(r'-([-/\dA-Za-z]+)$')[0].map(shipper_size_map)

    # oversea & self pickup mapping
    oversea = (~DF_A['Country'].isin(['Malaysia', 'Singapore'])) \
            & (DF_A['Tracking Number'] == '') \
            & (DF_A['Delivery Address'] != '')
    DF_A.loc[oversea,[
        'SEQ', 'Shipper', 'Store', 'Courier'
        ]] = ['40', 'DHL', 'WEB OS', 'DHL']
    DF_A.loc[DF_A['Country'] == '', [
        'SEQ', 'Shipper', 'Store', 'Courier'
        ]] = ['41', 'Self Pickup', 'WEB SP', 'Self Pickup']

    # platform mapping
    DF_A['Platform'] = 'Marketplace'
    DF_A.loc[DF_A['Store'].isin(['WEB NV', 'WEB AB', 'WEB SF', 'WEB SP', 'WEB OS']), 'Platform'] = 'Website'

    # phone number cleaning
    DF_A['Phone Number'] = DF_A['Phone Number'].str.replace(r'\D+', '', regex=True)
    malaysia = np.where(DF_A['Phone Number'].str.startswith('0'),
                        '60' + DF_A['Phone Number'].str[1:],
                        np.where(DF_A['Phone Number'].str.startswith('60'),
                                 DF_A['Phone Number'], '60' + DF_A['Phone Number']))
    singapore = np.where(DF_A['Phone Number'].str.startswith('65'),
                         DF_A['Phone Number'], '65' + DF_A['Phone Number'])

    DF_A['Phone Number'] = np.where(DF_A['Country'].str.strip().str.lower() == 'malaysia', malaysia,
                        np.where(DF_A['Country'].str.strip().str.lower() == 'singapore', singapore, DF_A['Phone Number']))
    DF_A['Phone Number'] = DF_A['Phone Number'].astype(str)

    necessary_columns = [
        'BigSeller Store Nickname', 'Order No', 'SKU', 'Product Name', 'Quantity',
        'Tracking Number', 'Receiver Name', 'Order Time', 'Package No', 'Marketplace',
        'Buyer Designed Logistics', 'Product Location', 'Country', 'Province (State)',
        'Delivery Address', 'Post Code', 'Phone Number', 'Order Total',
        'Platform', 'Shipper', 'Courier', 'Store', 'SEQ', 'Size Sequence',
        'Design', 'Design Color Size', 'Design Color', 'Design Size', 'Barcode'
    ]

    DF_A = DF_A[necessary_columns]
    DF_A = DF_A.drop_duplicates(subset=['Order No', 'SKU', 'Quantity'], keep='last')

    print(f'Processing Data - Rows: {DF_A.shape[0]}, Columns: {DF_A.shape[1]}')

    if DF_A.empty:
        print('Error: Data kosong selepas diproses!')
        return None
    return DF_A


'''''''''''''''
Data Filtering
'''''''''''''''

def process_step_b(
        designs=None, filter_design='none', warehouse='none',
        platform='none', stores='none', filter_batch='none'):
    global DF_A, DF_B, FILTER

    if designs is None:
        designs = []
    DF_B = DF_A.copy()

    # Order Group
    if 'Order No' in DF_B.columns:
        DF_B['Product Name Quantity'] = DF_B['Design Color Size'] +' ('+ DF_B['Quantity'].astype(str)+')'
        DF_B['SKU Quantity'] = DF_B['SKU'] +' ('+ DF_B['Quantity'].astype(str)+')'
        DF_B['Store Quantity'] = DF_B['Store'] +' ('+ DF_B['Quantity'].astype(str) +') : '

    # Filter based on user option
    FILTER = DF_B.copy()
    if designs:
        order_ids = FILTER[FILTER['Design'].isin(designs)]['Order No'].unique()
        if filter_design == 'include':
            FILTER = FILTER[FILTER['Order No'].isin(order_ids)]
        elif filter_design == 'exclude':
            FILTER = FILTER[~FILTER['Order No'].isin(order_ids)]

    if warehouse == 'inhanna':
        FILTER = FILTER[FILTER['BigSeller Store Nickname'].isin(['Inhanna Shopify','Inhanna Tiktok','Inhanna Shopee','Inhanna Zalora'])]
    elif warehouse == 'other':
        FILTER = FILTER[~FILTER['BigSeller Store Nickname'].isin(['Inhanna Shopify','Inhanna Tiktok','Inhanna Shopee','Inhanna Zalora'])]

    if platform == 'marketplace':
        FILTER = FILTER[FILTER['Marketplace'] != 'Shopify']
    elif platform == 'website':
        FILTER = FILTER[FILTER['Marketplace'] == 'Shopify']

    stores_map = {
        'tiktok_opt': 'TIK',
        'shopee_opt': 'SHO',
        'zalora_opt': 'ZAL',
        'ninjavan_opt': 'WEB NV',
        'abx_opt': 'WEB AB',
        'sf_opt': 'WEB SF',
        'oversea_opt': 'WEB OS',
        'spickup_opt': 'WEB SP'
    }

    if stores and isinstance(stores, list):
        store = [stores_map.get(opt) for opt in stores if opt in stores_map]
        if store:
            FILTER = FILTER[FILTER['Store'].isin(store)]

    # Assign order
    mapper = assign_order_sequence(FILTER) if filter_batch == 'none' \
            else assign_order_sequence_batch(FILTER)
    key = 'Order Sequence' if filter_batch == 'none' else 'Order Sequence Batched'
    FILTER[key] = FILTER['Order No'].map(mapper.set_index('Order No')[key])
    FILTER['Store Quantity'] = FILTER['Store'] + ' (' \
        + FILTER['Quantity'].astype(str) + ') : ' \
        + FILTER['Order No'].map(mapper.set_index('Order No')[key]).astype(str)

    return FILTER


def process_step_c():

    pass


'''''''''''''''
Assign Batch
'''''''''''''''

def assign_order_sequence(df):
    df_seq = df.groupby([
        'Order No','Order Time','SEQ'
        ])['Quantity'].sum().reset_index()\
            .sort_values(by=['SEQ','Order Time'], ascending=True)
    df_seq = df_seq[['Order No']]
    df_seq['Order Sequence'] = list(range(1, len(df_seq)+1))
    return df_seq


def assign_order_sequence_batch(df):
    df_seq = df.groupby([
        'Order No','Order Time','SEQ'
        ])['Quantity'].sum().reset_index()\
            .sort_values(by=['SEQ','Order Time'], ascending=True)
    df_seq = df_seq[['Order No']]
    df_seq['Order Sequence Batched'] = [((i % 100) + 1) for i in range(len(df_seq))]
    return df_seq


def get_picklist_batch(batch_no):
    df = load_filtered_data(batch_no)
    if df is not None and not df.empty:
        return picklist(df)
    return None


def get_orderlist_batch(batch_no):
    df = load_filtered_data(batch_no)
    if df is not None and not df.empty:
        return orderlist(df)
    return None


def load_filtered_data(batch_no):
    path = os.path.join(DOWNLOAD_FOLDER, 'order_step_b.csv')
    if not os.path.exists(path):
        print(f'{load_filtered_data.__name__} order_step_b.csv not found')
        return None
    df = pd.read_csv(path, encoding='utf-8')
    if 'Batch' not in df.columns:
        print(f'{load_filtered_data.__name__} Batch column not found')
        return None
    return df[df['Batch'] == batch_no].copy()


'''''''''''''''
Batch Dropdown List
'''''''''''''''

def assign_all_batch(df, batch_size=100, min_last_batch_size=30, filter_batch='none'):
    df = df.sort_values(by=['Order Sequence'], ascending=True)
    batch = df.copy()

    if filter_batch == 'none':
        batch['Batch'] = 1
        return batch
    # total_orders = batch['Order ID'].nunique()  # len(batch)

    batch['Batch'] = ((batch['Order Sequence'] - 1) // batch_size) + 1
    last_batch = batch['Batch'].max()
    last_batch_size = len(batch[batch['Batch'] == last_batch])
    # last_batch_size = batch[batch['Batch'] == last_batch]['Order ID'].nunique()

    if last_batch_size < min_last_batch_size and last_batch > 1:
        batch.loc[batch['Batch'] == last_batch, 'Batch'] = last_batch - 1

    # output_file = os.path.join(DOWNLOAD_FOLDER, 'order_step_b.csv')
    # batch.to_csv(output_file, index=False, encoding='utf-8')

    return batch


def dropdown_all_batch(df, filter_batch):
    if filter_batch == 'none':
        return [{'label': 'All Orders', 'value': 1}]

    unique_batches = sorted(df['Batch'].unique())
    dropdown_options = [{'label': f'Batch {b}', 'value': b} for b in unique_batches]
    return dropdown_options


'''''''''''''''
List Generation
'''''''''''''''

def picklist(df):
    global PL
    PL = df.copy()

    PL['loc_number'] = PL['Product Location'].astype(str).str.strip().replace('', '9999')
    PL = PL.groupby([
        'Product Location', 'SKU', 'Product Name', 'Size Sequence', 'loc_number', 'Design'
        ], dropna=False).agg({
            'Store Quantity': lambda x: ', '.join(x.map(str)),
            'Quantity': 'sum'}).reset_index()\
            .sort_values(by=['loc_number', 'Design', 'Size Sequence'], \
            ascending=True, na_position='last')

    PL['SKU Sequence'] = [i+1 for i in range(len(PL))]
    # PL['SKU Sequence'] = list(range(1, len(PL)+1))
    PL = PL[['SKU Sequence', 'Product Location', 'SKU', 'Product Name', 'Quantity', 'Store Quantity']]
    PL = PL.rename(columns={
        'SKU Sequence': 'NO', 'Product Location': 'LOCATION',
        'SKU': 'SKU', 'Product Name': 'PRODUCT NAME',
        'Quantity': 'QTY', 'Store Quantity': 'ORDER QTY'
    })
    return PL


def orderlist(df):
    global OL
    OL = df.copy()
    OL = OL.groupby([
        'Order Sequence', 'Order No','Receiver Name','Shipper'
        ]).agg({
            'Product Name Quantity': lambda x: ', '.join(x.fillna('').map(str)),
            'Quantity': 'sum'}).reset_index()
    OL = OL[['Order Sequence', 'Order No', 'Receiver Name', 'Product Name Quantity', 'Quantity', 'Shipper']]
    OL = OL.rename(columns={
        'Order Sequence': 'NO', 'Order No': 'ORDER NO',
        'Receiver Name': 'RECEIVER', 'Product Name Quantity': 'PRODUCT NAME',
        'Quantity': 'QTY', 'Shipper': 'SHIPPER'
    })
    return OL


def data_overview(df):
    global DO
    DO = df.copy()

    DO_1 = DO.copy()
    # Marketplace = DO_1[DO_1['Marketplace'] != 'Shopify']['Marketplace'].count()
    # Website = DO_1[DO_1['Marketplace'] == 'Shopify']['Marketplace'].count()
    # Order_by_Platform = pd.DataFrame({
    #     'Platform': ['Marketplace', 'Website'],
    #     'Total Order': [Marketplace, Website]
    #     }).reset_index(drop=True)

    Order_Count = DO_1.groupby(['Courier'])['Order No'].nunique().reset_index()
    Order_Count = Order_Count[['Courier', 'Order No']].rename(columns={'Order No': 'Total Order'})
    Order_by_Courier = Order_Count

    DO_2 = DO.copy()
    Order_Group = DO_2.groupby(['Platform', 'Store'])['Order No'].nunique().reset_index()
    Order_Group = Order_Group[['Platform', 'Store', 'Order No']].rename(columns={'Order No': 'Total Order'})

    Order_Group['Store'] = Order_Group['Store'].replace({
        'TIK': 'TikTok', 'SHO': 'Shopee', 'ZAL': 'Zalora', 'LAZ': 'Lazada',
        'WEB NV': 'Ninjavan', 'WEB AB': 'ABX', 'WEB SF': 'SF Express',
        'WEB OS': 'Oversea', 'WEB SP': 'Self Pickup'
    })

    custom_order = [
        'Shopee', 'TikTok', 'Zalora', 'Lazada',
        'Ninjavan', 'ABX', 'SF Express', 'Oversea', 'Self Pickup']
    Order_Group['Store'] = pd.Categorical(Order_Group['Store'], categories=custom_order, ordered=True)
    Order_Group = Order_Group.sort_values('Store')
    Order_Group

    return  Order_Group


def generate_list(options=''):
    global FILTER, PL, OL, DO

    if FILTER is None or FILTER.empty:
        print(f'{generate_list.__name__} : FILTER is empty !')
        return None

    PL = FILTER.copy()
    OL = FILTER.copy()
    DO = FILTER.copy()

    if options == 'picklist':
        print('Generating Picklist...')
        return picklist(PL)
    elif options == 'orderlist':
        print('Generating Orderlist...')
        return orderlist(OL)
    elif options == 'data_overview':
        print('Overview Data...')
        return data_overview(DO)
    elif options == 'tracking_map':
        print('Combine Tracking...')
        return latest_tracking_files()
    else:
        print('Error: Invalid option selected!')
        return None


'''''''''''''''
Process Tracking Number
'''''''''''''''

def get_latest_folder(folder_path):
    if not os.path.exists(folder_path):
        print(f'Folder not found: {folder_path}')
        return None

    files = glob.glob(os.path.join(folder_path, '*.xlsx'))
    if not files:
        print(f'No Excel files found in {folder_path}')
        return None

    latest_file = max(files, key=os.path.getmtime)
    print(f'Latest file found: {latest_file}')
    return latest_file


def process_abx(file_path):
    if not file_path:
        return pd.DataFrame()

    try:
        df = pd.read_excel(file_path)
        column = ['Unnamed: 5', 'Unnamed: 1']
        if not all(col in df.columns for col in column):
            print(f'ABX file missing expected columns: {column}')
            return pd.DataFrame()
        return df[column].iloc[1:]

    except Exception as e:
        print(f'Error reading ABX file: {e}')
        return pd.DataFrame()

    # if file_path:
    #     try:
    #         df = pd.read_excel(file_path)
    #         return df[['Unnamed: 5', 'Unnamed: 1']].iloc[1:]
    #     except Exception as e:
    #         print(f'Error reading ABX file: {e}')
    # return pd.DataFrame()


def process_sf(file_path):
    if not file_path:
        return pd.DataFrame()

    try:
        df = pd.read_excel(file_path)
        column = ['Shipment Reference No.', 'Waybill No. (Parent Waybill No. and Sub Waybill No.)']
        if not all(col in df.columns for col in column):
            print(f'SF file missing expected columns: {column}')
            return pd.DataFrame()

        return df[column]
    except Exception as e:
        print(f'Error reading SF file: {e}')
        return pd.DataFrame()

    # if file_path:
    #     try:
    #         df = pd.read_excel(file_path)
    #         return df[['Shipment Reference No.', 'Waybill No. (Parent Waybill No. and Sub Waybill No.)']]
    #     except Exception as e:
    #         print(f'Error reading SF file: {e}')
    # return pd.DataFrame()


def process_nv():
    global FILTER
    if FILTER is None or FILTER.empty:
        csv_path = os.path.join(DOWNLOAD_FOLDER, 'order_step_b.csv')
        if os.path.exists(csv_path):
            FILTER = pd.read_csv(csv_path, encoding='utf-8')

    if FILTER is not None and not FILTER.empty:
        try:
            track = FILTER[(FILTER['Marketplace'] == 'Shopify') & (FILTER['Courier'] == 'Ninjavan')].copy()
            base = 'NVMYINHAN'
            total_length = 18
            full_number = [base + str(i).zfill(total_length - len(base)) for i in track['Order No']]
            return pd.DataFrame({
                'order_id': track['Order No'].values,
                'tracking': full_number
            }).drop_duplicates(subset=['order_id'], keep='first')
        except Exception as e:
            print(f'Error processing NV tracking: {e}')
    return pd.DataFrame()


def latest_tracking_files():
    # UPLOAD_FOLDER
    # DOWNLOAD_FOLDER
    uploads_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    sf_folder = os.path.join(uploads_folder, 'sf')
    abx_folder = os.path.join(uploads_folder, 'abx')

    sf_file = get_latest_folder(sf_folder)
    abx_file = get_latest_folder(abx_folder)

    sf_track = process_sf(sf_file)
    abx_track = process_abx(abx_file)
    nv_track = process_nv()

    if sf_track.empty and abx_track.empty and nv_track.empty:
        print('No tracking files found to combine.')
        return None

    try:
        combined_track = pd.concat([
            sf_track.rename(columns={'Shipment Reference No.': 'Order No', 'Waybill No. (Parent Waybill No. and Sub Waybill No.)': 'Tracking Number'}),
            abx_track.rename(columns={'Unnamed: 5': 'Order No', 'Unnamed: 1': 'Tracking Number'}),
            nv_track.rename(columns={'order_id': 'Order No', 'tracking': 'Tracking Number'})
        ], ignore_index=True)

        combined_track['Order No'] = combined_track['Order No'].astype(str).str.strip().str.replace('-', ' ').str.split().str[0]

        output_path = os.path.join(DOWNLOAD_FOLDER, 'tracking_map.csv')
        combined_track.to_csv(output_path, index=False, encoding='utf-8-sig')
        print(f'Combined tracking data saved to: {output_path}')
        return combined_track

    except Exception as e:
        print(f'Error combining tracking data: {e}')
        return None


'''''''''''''''
Export Files
'''''''''''''''

def export_file(df):
    global FILTER
    df = df.copy()

    export = [
        'awb_ninjavan','awb_abx','awb_sf',
        'scan_mp','scan_web',
        'tracking_update', 'order_mark'
        ]

    # file_paths = []
    file_paths = {}

    for file in export:
        if file in globals():
            file_func = globals()[file]
    #         file_paths.append(file_path)
    # return file_paths
            if callable(file_func):
                try:
                    if df is not None and not df.empty:
                        file_path = file_func(df)
                        file_paths[file] = file_path
                    else:
                        file_func
                        print(f'Data is empty for {file}')
                except Exception as e:
                    print(f'Export failed: {file} - {str(e)}')
    return file_paths


# Ninja AWB
def awb_ninjavan(df):
    if 'Shipper' in df.columns:
        df = df[df['Shipper'] == 'Ninjavan']

    if df.empty:
        print('Ninja : No data found. Export skipped')
        return None

    nv = df.copy()
    # if 'ORDER NO' not in df.columns:
    if 'SKU Quantity' in nv.columns:
        nv = nv.groupby([
            'Order No', 'Receiver Name', 'Post Code',
            'Phone Number', 'Delivery Address', 'Province (State)'
        ], as_index=False).agg({
            'SKU Quantity': lambda x: ', '.join(x.fillna('').astype(str)),
            'Quantity': 'sum'
        })

    nv['Phone Number'] = pd.to_numeric(nv['Phone Number'], errors='coerce').astype(int).astype(str)
    nv[['PARCEL SIZE', 'EMAIL']] = 'S', ''
    nv['CONSIGNEE'] = nv['Delivery Address'] +', '+ nv['Province (State)']
    nv['TOTAL PIECES'] = nv['Quantity'].astype(str) + '-' + nv['SKU Quantity']
    nv['NO'] = range(1, len(nv) + 1)
    nv['Receiver Name'] = nv.apply(lambda x: f"{x['NO']}-{x['Receiver Name']}", axis=1)

    nv = nv[[
            'NO', 'Order No', 'EMAIL', 'TOTAL PIECES', 'Receiver Name',
            'CONSIGNEE', 'Post Code', 'Phone Number', 'PARCEL SIZE'
            ]]
    nv = nv.rename(columns={
          'Order No': 'ORDER NO', 'Receiver Name': 'NAME',
          'Post Code': 'POSTCODE', 'Phone Number': 'PHONE'})

    # nv_output = os.path.join(os.path.expanduser('~'), 'Desktop', '01-NV_Upload.xlsx')
    nv_output = os.path.join(EXPORT_FOLDER, '01-NV_Upload.xlsx')
    nv.to_excel(nv_output, index=False)
    return nv_output


# ABX AWB
def awb_abx(df):
    if 'Shipper' in df.columns:
        df = df[df['Shipper'] == 'ABX']

    if df.empty:
        print('ABX : No data found. Export skipped')
        return None

    abx = df.copy()
    if 'CneeName' not in df.columns:
        abx = abx.groupby([
                'Order No', 'Delivery Address', 'Post Code', 'Province (State)',
                'Receiver Name', 'Phone Number', 'Order Total'
            ], as_index=False).agg({
                'SKU Quantity': lambda x: ', '.join(x.fillna('').astype(str)),
                'Quantity': 'sum'
            })

    abx['Phone Number'] = pd.to_numeric(abx['Phone Number'], errors='coerce').fillna(0).astype(int).astype(str)
    abx[['Weight', 'Pcs', 'Description_Goods']] = ['1.00','1.00','Fashion Clothes']
    abx[['CneeAdd2', 'CneeAdd3', 'CneeAdd4', 'Remark 2', 'Remark 3',
        'COD amount (RM)', 'Service Type', 'HCR/DO No 1',
        'HCR/DO No 2', 'DeclaredCurrency', 'Alert']] = None

    abx['Receiver Name'] = abx.apply(lambda x: f"{abx.index.get_loc(x.name) + 1}-{x['Receiver Name']}", axis=1)
    abx['CneeAdd1'] = abx['Delivery Address'] +', '+ abx['Province (State)']
    abx['Remark'] = abx['Quantity'].astype(str) + '-' + abx['SKU Quantity']
    abx = abx[[
            'Order No', 'CneeAdd1', 'CneeAdd2', 'CneeAdd3', 'CneeAdd4', 'Post Code',
            'Receiver Name', 'Phone Number', 'Weight', 'Pcs', 'Remark', 'DeclaredCurrency',
            'Order Total', 'Remark 2', 'Remark 3', 'COD amount (RM)', 'Service Type',
            'HCR/DO No 1', 'HCR/DO No 2', 'Description_Goods', 'Alert'
        ]]

    abx = abx.rename(columns={
            'Order No': 'CneeName', 'Receiver Name':'CneeContact', 'Phone Number':'CneeTel',
            'Order Total':'DeclaredValue', 'Post Code':'CneeDestCode'
        })
    # abx_output = os.path.join(os.path.expanduser('~'), 'Desktop', '02-ABX_Upload.xlsx')
    abx_output = os.path.join(EXPORT_FOLDER, '02-ABX_Upload.xlsx')
    abx.to_excel(abx_output, index=False)
    return abx_output


# SF AWB
def awb_sf(df):
    if 'Country' in df.columns:
        df = df[(df['Marketplace'] == 'Shopify') & (df['Province (State)'] == 'Singapore') ]

    if df.empty:
        print('SF : No data found. Export skipped')
        return None

    # sf_file = df.copy()
    sf_scan = df.copy()

    if 'Shipment Reference No.' not in sf_scan.columns:
        sf_scan = sf_scan.groupby([
                'Order No', 'Receiver Name', 'Phone Number', 'Delivery Address',
                'Post Code', 'Order Total'
            ], as_index=False).agg({
                'SKU Quantity': lambda x: ', '.join(x.fillna('').astype(str)),
                'Quantity': 'sum'
            })

    sf_scan['Phone Number'] = pd.to_numeric(sf_scan['Phone Number'], errors='coerce').fillna(0).astype(int).astype(str)
    sf_scan['Remark'] = sf_scan['Quantity'].astype(str) + '-' + sf_scan['SKU Quantity']

    header_2 = [
        'Shipment Reference No.', 'Receiver email', 'Recipient Name',
        'Recipient Company', 'Recipient Telephone', 'Receiver Address',
        'Receiver Postal Code', 'Receiver Country/Region', 'Receiver State',
        'Receiver City', 'Content', 'Unit Price', 'Quantity', 'Unit',
        'AWB Remarks', 'Company Name ( Shipper )', 'Contact Name ( Shipper )',
        'Tel ( Shipper )', 'Address ( Shipper )', 'Country/Region (Shipper )',
        'State (Shipper)', 'City (Shipper)', 'Postal Code    ( Shipper )',
        'Email              ( Shipper )', 'Shipment Type', 'Notify to pick up',
        'Payment Method', 'Account No.', 'Tax payment', 'Total Package', 'Currency', 'Origin'    ]

    header_map = {
        'Shipment Reference No.': '1. RECEIVER',
        'Company Name ( Shipper )': '2. SHIPPER',
        'Shipment Type': '3. Service',
        'Payment Method': '4. Payment',
        'Total Package': '5. Commodities'}

    blank_row = [''] * len(header_2)  # 3th row
    sf_file = pd.DataFrame([header_2, blank_row], columns=header_2)

    a = ['Receiver Country/Region', 'Receiver State', 'Receiver City',
        'Content', 'Unit', 'Company Name ( Shipper )', 'Contact Name ( Shipper )',
        'Tel ( Shipper )', 'Address ( Shipper )', 'Country/Region (Shipper )',
        'State (Shipper)', 'City (Shipper)', 'Postal Code    ( Shipper )',
        'Email              ( Shipper )', 'Shipment Type', 'Notify to pick up',
        'Payment Method', 'Account No.', 'Tax payment', 'Total Package', 'Currency', 'Origin']

    b = ['Singapore', 'Singapore', 'Singapore', 'Fashion Clothes', 'pieces',
        'Inhanna Sdn Bhd',	'Inhanna Sdn Bhd', '60106528262', 'Jalan Zuhal U5/178, Seksyen U5',
        'Malaysia', 'Selangor', 'Shah Alam', '40150', 'warehouse@inhanna.com',
        'E-commerce Express-CD', 'Courier Pickup', 'Shipper', '0605000653',
        'Receiver', '1', 'MYR', 'Malaysia']

    if len(sf_file) < (2 + len(sf_scan)):
        missing_rows = (2+len(sf_scan)) - len(sf_file)
        extra_rows = pd.DataFrame({col: [''] * missing_rows for col in sf_file.columns})
        sf_file = pd.concat([sf_file, extra_rows], ignore_index=True)

    sf_file.loc[2:2+len(sf_scan)-1,'Shipment Reference No.'] = sf_scan['Order No'].values
    sf_file.loc[2:2+len(sf_scan)-1, 'Recipient Name'] = sf_scan['Receiver Name'].values
    sf_file.loc[2:2+len(sf_scan)-1, 'Recipient Telephone'] = sf_scan['Phone Number'].values
    sf_file.loc[2:2+len(sf_scan)-1, 'Receiver Address'] = sf_scan['Delivery Address'].values
    sf_file.loc[2:2+len(sf_scan)-1, 'Receiver Postal Code'] = sf_scan['Post Code'].values
    sf_file.loc[2:2+len(sf_scan)-1, 'Unit Price'] = sf_scan['Order Total'].values
    sf_file.loc[2:2+len(sf_scan)-1, 'Quantity'] = sf_scan['Quantity'].values
    sf_file.loc[2:2+len(sf_scan)-1, 'Unit Price'] = sf_scan['Order Total'].values
    sf_file.loc[2:2+len(sf_scan)-1, 'AWB Remarks'] = sf_scan['Remark'].values
    sf_file.loc[2:2+len(sf_scan)-1, a] = b

    sf_file.rename(columns={col: header_map.get(col, '') for col in header_2}, inplace=True)

    # sf_output = os.path.join(os.path.expanduser('~'), 'Desktop', '03-SF_Upload.xlsx')
    sf_output = os.path.join(EXPORT_FOLDER, '03-SF_Upload.xlsx')
    sf_file.to_excel(sf_output, index=False)
    return sf_output


# MP Scan Upload
def scan_mp(df):
    mp = df.copy()

    if 'Marketplace' in mp.columns:
        mp = mp[mp['Marketplace'] != 'Shopify']

    if mp.empty:
        print('MP Scan : No data found. Export skipped')
        return None

    # mp['Total Quantity'] = mp['Order No'].apply(lambda x: mp.loc[mp['Order No'] == x, 'Quantity'].sum())

    mp_file = pd.DataFrame(columns=[
    'Order ID', 'Order Status', 'Return / Refund Status', 'Tracking Number*',
    'Shipping Option', 'Shipment Method', 'Estimated Ship Out Date', 'Ship Time',
    'Order Creation Date', 'Order Paid Time', 'Parent SKU Reference No.',
    'Product Name', 'SKU Reference No.', 'Variation Name', 'Original Price',
    'Deal Price', 'Quantity', 'Product Subtotal', 'Seller Rebate', 'Seller Discount',
    'Shopee Rebate', 'SKU Total Weight', 'No of product in order'
    ])
    # mp_file = pd.DataFrame(columns=mp_file)

    mp_file['Order ID'] = mp['Order No']
    mp_file['Tracking Number*'] = mp['Tracking Number']
    mp_file['Product Name'] = mp['Design Color Size']
    mp_file['SKU Reference No.'] = mp['SKU']
    mp_file['Quantity'] = mp['Quantity'].astype(int)

    # Ensure no duplicate
    mp_file.drop_duplicates(subset=[
        'Order ID', 'Product Name', 'Tracking Number*','SKU Reference No.', 'Quantity'
        ], inplace=True)
    mp_file['No of product in order'] = mp_file.groupby('Order ID')['Quantity'].transform('sum')

    # mp_scan_output = os.path.join(os.path.expanduser('~'), 'Desktop', '04-MP_ScanAWB_Upload.csv')
    mp_scan_output = os.path.join(EXPORT_FOLDER, '04-MP_ScanAWB_Upload.csv')
    mp_file.to_csv(mp_scan_output,index=False)
    return mp_scan_output


# Web Scan Upload
def scan_web(df):
    tracking_df = latest_tracking_files()

    if tracking_df is None:
        return None

    web = df.copy()

    if 'Marketplace' in web.columns:
        web = web[web['Marketplace'] ==  'Shopify']

    if web.empty:
        print('Web Scan : No data found. Export skipped')

    web_file = pd.DataFrame(columns=[
        'Order ID', 'Order Status', 'Return / Refund Status', 'Tracking Number*',
        'Shipping Option', 'Shipment Method', 'Estimated Ship Out Date', 'Ship Time',
        'Order Creation Date', 'Order Paid Time', 'Parent SKU Reference No.',
        'Product Name', 'SKU Reference No.', 'Variation Name', 'Original Price',
        'Deal Price', 'Quantity', 'Product Subtotal', 'Seller Rebate', 'Seller Discount',
        'Shopee Rebate', 'SKU Total Weight', 'No of product in order'
    ])

    web_file['Order ID'] = web['Order No']
    web_file['Product Name'] = web['Design Color Size']
    web_file['SKU Reference No.'] = web['SKU']
    web_file['Quantity'] = web['Quantity']

    # Ensure no duplicate
    web_file.drop_duplicates(subset=[
        'Order ID', 'Product Name', 'Tracking Number*','SKU Reference No.', 'Quantity'
        ], inplace=True)
    web_file['No of product in order'] = web_file.groupby('Order ID')['Quantity'].transform('sum')

    # Map tracking number
    web_file['Tracking Number*'] = web_file['Order ID'].map(tracking_df.set_index('Order No')['Tracking Number'])

    # Drop if no tracking number
    web_file.dropna(subset=['Tracking Number*'], inplace=True)

    # web_scan_output = os.path.join(os.path.expanduser('~'), 'Desktop', '04-Web_ScanAWB_Upload.csv')
    web_scan_output = os.path.join(EXPORT_FOLDER, '04-Web_ScanAWB_Upload.csv')
    web_file.to_csv(web_scan_output,index=False)

    return web_scan_output


# Tracking for Bigseller
def tracking_update(df):
    tracking_df = latest_tracking_files()
    if tracking_df is None:
        return None
        tracking_df = pd.read_csv(os.path.join(DOWNLOAD_FOLDER,'tracking_map.csv')).copy()

    track = df.copy()

    if track.empty:
        print('Tracking Update : No data found. Export skipped')

    if 'Marketplace' in track.columns:
        track_update = track[(track['Marketplace'] == 'Shopify') &
                            (~track['Courier'].str.contains('DHL|Self Pickup'))].copy()

    track_abx = 'https://www.tracking.my/kex/'
    track_sf = 'https://www.sf-international.com/my/en/support/querySupport/waybill?No='
    track_nv = 'https://www.ninjavan.co/en-my/tracking?id='

    track_update = track_update[['Order No', 'Package No',
                                'Tracking Number', 'Province (State)']].drop_duplicates()

    track_update['Update Courier'] = track_update['Province (State)'].apply(
                              lambda x: 'SF Express' if x == 'Singapore' else
                                        'Ninja Van' if x not in ['Singapore', 'Sabah', 'Sarawak'] else '')

    track_update['Update Url'] = track_update['Province (State)'].apply(
                              lambda x: track_sf if x == 'Singapore' else
                                        track_nv if x not in ['Singapore', 'Sabah', 'Sarawak'] else track_abx)

    track_update['Tracking Number'] = track_update['Order No'].map(tracking_df.set_index('Order No')['Tracking Number'])
    track_update.dropna(subset=['Tracking Number'], inplace=True)

    track_update['Update Url'] = track_update['Update Url'] + track_update['Tracking Number']
    track_update.rename(columns={
        'Update Url': 'Tracking URL',
        'Update Courier': 'Logistics Name'}, inplace=True)

    track_update = track_update[['Package No', 'Tracking Number', 'Logistics Name', 'Tracking URL']]

    header = ['Package No', 'Tracking Number',	'Logistics Name',	'Tracking URL']
    blank_row = [''] * len(header)
    track_file = pd.DataFrame([blank_row]*3, columns=header)

    track_update_file = pd.concat([track_file, track_update], axis=0, join='inner')

    # track_update_output = os.path.join(os.path.expanduser('~'), 'Desktop', '05-Web_Tracking_Update.xlsx')
    track_update_output = os.path.join(EXPORT_FOLDER, '05-Web_Tracking_Update.xlsx')
    track_update_file.to_excel(track_update_output , index=False)

    return track_update_output


# Order Mark for Bigseller
def order_mark(df):
    data = request.get_json()

    design_value = data.get('selectDesign', [])  # List of selected designs
    filter_design_value = data.get('filterDesign')  # include / exclude
    label_value = data.get('labelDropdown')  # e.g., 'Preorder'

    if filter_design_value == 'include':
        filtered = df[df['Design'].isin(design_value)]
    elif filter_design_value == 'exclude':
        filtered = df[~df['Design'].isin(design_value)]
    else:
        return 'Invalid filter'

    result = filtered[['Order No']].drop_duplicates()
    result['Label'] = label_value
    result.rename(columns={
        'Order No': '*Order No/Tracking No(required)',
        'Label': '*Order Mark(required)'
        }, inplace=True)

    # result_output = os.path.join(os.path.expanduser('~'), 'Desktop', '06-Order_Mark.xlsx')
    result_output = os.path.join(EXPORT_FOLDER, '06-Order_Mark.xlsx')
    result.to_excel(result_output , index=False)

    return result_output

